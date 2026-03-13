// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * Swordfish - ERC-3643 合规代币系统
 * 
 * 证券型代币核心功能:
 * - 转账限制 (Transfer Rules)
 * - 分红权 (Dividend Rights)
 * - 投票权 (Voting Rights)
 * - KYC/AML 合规检查
 * - 批量转账
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// ==================== 接口定义 ====================

/**
 * @title IERC3643Compliance
 * @dev 合规模块接口
 */
interface IERC3643Compliance {
    function checkTransfer(address from, address to, uint256 amount) external view returns (bool);
    function checkMint(address to, uint256 amount) external view returns (bool);
    function checkBurn(address from, uint256 amount) external view returns (bool);
}

/**
 * @title IERC3643IdentityRegistry
 * @dev 身份注册接口
 */
interface IERC3643IdentityRegistry {
    function isVerified(address _account) external view returns (bool);
    function isBlocked(address _account) external view returns (bool);
    function investorCountry(address _account) external view returns (uint16);
}

// ==================== 主合约 ====================

/**
 * @title SwordfishSecurityToken
 * @dev 证券型代币 (ERC-3643 兼容)
 */
contract SwordfishSecurityToken is ERC20, ERC20Burnable, Ownable, ReentrancyGuard {
    
    using EnumerableSet for EnumerableSet.AddressSet;
    
    // ==================== 常量 ====================
    uint256 public constant decimals = 18;
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**decimals; // 10亿代币
    
    // ==================== 状态变量 ====================
    
    // 代币信息
    string private _name;
    string private _symbol;
    address public treasury; // 国库地址
    address public complianceModule; // 合规模块
    
    // 身份注册
    IERC3643IdentityRegistry public identityRegistry;
    
    // 分红
    mapping(address => uint256) public dividendBalance;
    uint256 public totalDividends;
    uint256 public dividendsClaimed;
    
    // 锁定
    mapping(address => uint256) public lockedBalance;
    mapping(address => mapping(address => uint256)) public delegateVotes;
    
    // 投资者集合
    EnumerableSet.AddressSet private _verifiedInvestors;
    EnumerableSet.AddressSet private _blockedInvestors;
    
    // 转账限制
    bool public transferRestrictionsEnabled = true;
    mapping(address => bool) public allowedControllers;
    
    // ==================== 事件 ====================
    
    event TransferRestrictionUpdated(bool enabled);
    event IdentityRegistryUpdated(address indexed registry);
    event ComplianceModuleUpdated(address indexed module);
    event TreasuryUpdated(address indexed treasury);
    event DividendClaimed(address indexed investor, uint256 amount);
    event TokensLocked(address indexed account, uint256 amount, uint256 releaseTime);
    event VotesDelegated(address indexed from, address indexed to, uint256 votes);
    
    // ==================== 构造函数 ====================
    
    constructor(
        string memory name_,
        string memory symbol_,
        address _treasury,
        address _identityRegistry
    ) ERC20(name_, symbol_) {
        _name = name_;
        _symbol = symbol_;
        treasury = _treasury;
        identityRegistry = IERC3643IdentityRegistry(_identityRegistry);
        allowedControllers[msg.sender] = true;
    }
    
    // ==================== 修饰符 ====================
    
    modifier onlyController() {
        require(allowedControllers[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    // ==================== 核心功能 ====================
    
    /**
     * @dev 铸造代币 (仅限合规)
     */
    function mint(address to, uint256 amount) external onlyController {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        
        if (address(identityRegistry) != address(0)) {
            require(identityRegistry.isVerified(to), "Not verified");
            require(!identityRegistry.isBlocked(to), "Account blocked");
        }
        
        _mint(to, amount);
    }
    
    /**
     * @dev 销毁代币
     */
    function burn(uint256 amount) external override {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _burn(msg.sender, amount);
    }
    
    /**
     * @dev 转账 (带合规检查)
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        require(!transferRestrictionsEnabled || _checkTransfer(msg.sender, to, amount), "Transfer not allowed");
        return super.transfer(to, amount);
    }
    
    /**
     * @dev 转账从 (带合规检查)
     */
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        require(!transferRestrictionsEnabled || _checkTransfer(from, to, amount), "Transfer not allowed");
        return super.transferFrom(from, to, amount);
    }
    
    /**
     * @dev 批量转账
     */
    function batchTransfer(address[] calldata recipients, uint256[] calldata amounts) external nonReentrant {
        require(recipients.length == amounts.length, "Length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            transfer(recipients[i], amounts[i]);
        }
    }
    
    // ==================== 合规功能 ====================
    
    /**
     * @dev 检查转账是否合规
     */
    function _checkTransfer(address from, address to, uint256 amount) internal view returns (bool) {
        if (address(identityRegistry) != address(0)) {
            // 检查发送方
            if (!identityRegistry.isVerified(from) || identityRegistry.isBlocked(from)) {
                return false;
            }
            // 检查接收方
            if (!identityRegistry.isVerified(to) || identityRegistry.isBlocked(to)) {
                return false;
            }
        }
        
        // 如果有合规模块，调用它
        if (complianceModule != address(0)) {
            return IERC3643Compliance(complianceModule).checkTransfer(from, to, amount);
        }
        
        return true;
    }
    
    /**
     * @dev 设置转账限制
     */
    function setTransferRestrictions(bool enabled) external onlyOwner {
        transferRestrictionsEnabled = enabled;
        emit TransferRestrictionUpdated(enabled);
    }
    
    /**
     * @dev 设置身份注册合约
     */
    function setIdentityRegistry(address _registry) external onlyOwner {
        identityRegistry = IERC3643IdentityRegistry(_registry);
        emit IdentityRegistryUpdated(_registry);
    }
    
    /**
     * @dev 设置合规模块
     */
    function setComplianceModule(address _module) external onlyOwner {
        complianceModule = _module;
        emit ComplianceModuleUpdated(_module);
    }
    
    /**
     * @dev 添加/移除控制器
     */
    function setController(address controller, bool allowed) external onlyOwner {
        allowedControllers[controller] = allowed;
    }
    
    // ==================== 分红功能 ====================
    
    /**
     * @dev 分配分红
     */
    function distributeDividends() external payable onlyOwner {
        require(msg.value > 0, "No funds");
        totalDividends += msg.value;
    }
    
    /**
     * @dev 领取分红
     */
    function claimDividend() external nonReentrant {
        uint256 owed = dividendBalance[msg.sender];
        require(owed > 0, "No dividends");
        
        (bool success, ) = payable(msg.sender).call{value: owed}("");
        require(success, "Transfer failed");
        
        dividendBalance[msg.sender] = 0;
        dividendsClaimed += owed;
        
        emit DividendClaimed(msg.sender, owed);
    }
    
    /**
     * @dev 计算并记录分红
     */
    function processDividends(address[] calldata investors) external onlyOwner {
        require(totalDividends > 0, "No dividends");
        
        uint256 perToken = totalDividends / totalSupply();
        
        for (uint256 i = 0; i < investors.length; i++) {
            uint256 amount = balanceOf(investors[i]) * perToken;
            dividendBalance[investors[i]] += amount;
        }
    }
    
    // ==================== 投票权 ====================
    
    /**
     * @dev 委托投票权
     */
    function delegate(address delegatee) external {
        uint256 votes = balanceOf(msg.sender);
        _delegate(msg.sender, delegatee, votes);
    }
    
    function _delegate(address delegator, address delegatee, uint256 votes) internal {
        delegateVotes[delegator][delegatee] += votes;
        emit VotesDelegated(delegator, delegatee, votes);
    }
    
    /**
     * @dev 获取委托投票数
     */
    function getVotes(address account) external view returns (uint256) {
        uint256 total;
        for (uint256 i = 0; i < _verifiedInvestors.length(); i++) {
            total += delegateVotes[_verifiedInvestors.at(i)][account];
        }
        return total;
    }
    
    // ==================== 查询 ====================
    
    /**
     * @dev 获取已验证投资者数量
     */
    function getVerifiedInvestorCount() external view returns (uint256) {
        return _verifiedInvestors.length();
    }
    
    /**
     * @dev 获取待领取分红
     */
    function getPendingDividends(address investor) external view returns (uint256) {
        return dividendBalance[investor];
    }
    
    /**
     * @dev 获取锁定余额
     */
    function getLockedBalance(address account) external view returns (uint256) {
        return lockedBalance[account];
    }
}

// ==================== 电力资产代币 ====================

/**
 * @title SwordfishEnergyToken
 * @dev 电力资产代币 - 代表实际电力资产的所有权
 */
contract SwordfishEnergyToken is ERC20, Ownable {
    
    struct EnergyAsset {
        uint256 capacity;      // 装机容量 (kW)
        uint256 annualOutput;  // 年发电量 (kWh)
        string location;       // 位置
        string assetType;      // 资产类型 (solar/wind/hydro)
        bool isActive;         // 是否活跃
    }
    
    mapping(address => EnergyAsset) public assets;
    uint256 public assetCount;
    
    event AssetTokenized(address indexed owner, uint256 tokenId, uint256 capacity);
    
    constructor(
        string memory name_,
        string memory symbol_
    ) ERC20(name_, symbol_) {}
    
    /**
     * @dev 代币化能源资产
     */
    function tokenizeAsset(
        uint256 capacity,
        uint256 annualOutput,
        string calldata location,
        string calldata assetType
    ) external returns (uint256) {
        assetCount++;
        
        // 每1kW装机容量 = 1000 代币
        uint256 tokens = capacity * 1000;
        
        assets[msg.sender] = EnergyAsset({
            capacity: capacity,
            annualOutput: annualOutput,
            location: location,
            assetType: assetType,
            isActive: true
        });
        
        _mint(msg.sender, tokens);
        
        emit AssetTokenized(msg.sender, assetCount, capacity);
        
        return assetCount;
    }
    
    /**
     * @dev 获取资产信息
     */
    function getAssetInfo(address owner) external view returns (EnergyAsset memory) {
        return assets[owner];
    }
}
