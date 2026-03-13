// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * SolarAssetToken - 光伏资产代币
 * 基于简化ERC-3643设计
 */
contract SolarAssetToken is ERC20, ReentrancyGuard {
    
    // 光伏资产属性
    struct SolarAsset {
        string location;           // 区域
        uint256 capacity;         // 装机容量(kW)
        uint256 fitRate;          // FIT电价(日元/kWh)
        uint256 startDate;        // 并网日期
        uint256 expectedYield;    // 预期年发电量(kWh)
        address owner;            // 资产所有者
        bool isActive;           // 是否激活
    }
    
    mapping(uint256 => SolarAsset) public solarAssets;
    uint256 public totalAssets;
    
    // 分红记录
    struct Dividend {
        uint256 amount;
        uint256 distributionDate;
        uint256 perTokenDividend;
    }
    
    mapping(uint256 => Dividend[]) public assetDividends;
    
    // 收益池
    address public revenuePool;
    address public owner;
    
    // 发行者权限
    mapping(address => bool) public issuers;
    
    // 事件
    event SolarAssetTokenized(
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 tokens,
        uint256 expectedYield
    );
    
    event DividendDistributed(
        uint256 indexed tokenId,
        uint256 revenue,
        uint256 perTokenDividend
    );
    
    modifier onlyIssuer() {
        require(issuers[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }
    
    constructor() ERC20("Solar Asset Token", "sRWA") {
        owner = msg.sender;
    }
    
    // ============ 发行光伏资产代币 ============
    function issueSolarToken(
        address recipient,
        string memory location,
        uint256 capacity,
        uint256 fitRate,
        uint256 expectedYield
    ) external onlyIssuer returns (uint256) {
        require(capacity > 0, "Capacity must be > 0");
        
        uint256 tokenId = totalAssets++;
        
        solarAssets[tokenId] = SolarAsset({
            location: location,
            capacity: capacity,
            fitRate: fitRate,
            startDate: block.timestamp,
            expectedYield: expectedYield,
            owner: recipient,
            isActive: true
        });
        
        // 发行代币：每1kWh预期年发电量 = 1代币
        uint256 tokensToMint = expectedYield;
        _mint(recipient, tokenId, tokensToMint, "");
        
        emit SolarAssetTokenized(tokenId, recipient, tokensToMint, expectedYield);
        
        return tokenId;
    }
    
    // ============ 分配电费收益（分红） ============
    function distributeDividend(uint256 tokenId, uint256 generationAmount) 
        external 
        onlyIssuer 
    {
        require(solarAssets[tokenId].isActive, "Asset not active");
        
        // 计算电费收入
        uint256 revenue = generationAmount * solarAssets[tokenId].fitRate / 100;
        
        // 计算每代币分红
        uint256 totalSupply = totalSupply(tokenId);
        require(totalSupply > 0, "No tokens outstanding");
        
        uint256 dividendPerToken = revenue * 10**18 / totalSupply;
        
        // 记录分红
        assetDividends[tokenId].push(Dividend({
            amount: revenue,
            distributionDate: block.timestamp,
            perTokenDividend: dividendPerToken
        }));
        
        emit DividendDistributed(tokenId, revenue, dividendPerToken);
    }
    
    // ============ 设置收益池 ============
    function setRevenuePool(address _pool) external {
        require(msg.sender == owner, "Not authorized");
        revenuePool = _pool;
    }
    
    // ============ 授权发行者 ============
    function addIssuer(address _issuer) external {
        require(msg.sender == owner, "Not authorized");
        issuers[_issuer] = true;
    }
    
    // ============ 代币转移（简化版） ============
    function transfer(address to, uint256 amount) public override returns (bool) {
        // 添加转让限制逻辑
        return super.transfer(to, amount);
    }
    
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override returns (bool) {
        // 添加KYC检查逻辑
        return super.transferFrom(from, to, amount);
    }
    
    // ============ 查询 ============
    function getAssetInfo(uint256 tokenId) external view returns (SolarAsset memory) {
        return solarAssets[tokenId];
    }
    
    function getDividendHistory(uint256 tokenId) external view returns (Dividend[] memory) {
        return assetDividends[tokenId];
    }
    
    // 实现ERC-165接口（简化）
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x80ac58cd || interfaceId == 0x01ffc9a7;
    }
}
