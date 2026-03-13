// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * GreenGrid Token System - 核心智能合约
 * 包含治理代币、资产代币化、交易激励
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract GreenGridTokenSystem is Ownable, ReentrancyGuard {
    
    // ============ 代币地址 ============
    address public governanceToken;      // GGT 治理代币
    address public solarAssetToken;      // 光伏资产代币
    address public batteryAssetToken;    // 储能资产代币
    address public utilityToken;          // EP 效用代币
    address public daoGovernance;        // DAO治理合约
    address public revenueDistributor;    // 收益分配
    address public oracle;               // 预言机
    
    // ============ 家庭资产结构 ============
    struct HouseholdAsset {
        uint256 solarCapacity;      // 光伏容量(kW)
        uint256 batteryCapacity;    // 电池容量(kWh)
        uint256 vppParticipation;  // VPP参与度
        uint256 energyCredit;      // 能源积分
        bool isActive;             // 是否激活
    }
    
    mapping(address => HouseholdAsset) public householdAssets;
    address[] public registeredHouseholds;
    
    // ============ 事件 ============
    event HouseholdRegistered(
        address indexed owner,
        uint256 solarTokens,
        uint256 batteryTokens,
        uint256 initialCredit
    );
    
    event SolarAssetTokenized(
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 tokens,
        uint256 expectedYield
    );
    
    // ============ 构造函数 ============
    constructor() {
        // 初始化代币地址（后续通过setter设置）
    }
    
    // ============ 设置代币地址 ============
    function setGovernanceToken(address _token) external onlyOwner {
        governanceToken = _token;
    }
    
    function setSolarAssetToken(address _token) external onlyOwner {
        solarAssetToken = _token;
    }
    
    function setUtilityToken(address _token) external onlyOwner {
        utilityToken = _token;
    }
    
    function setOracle(address _oracle) external onlyOwner {
        oracle = _oracle;
    }
    
    // ============ 家庭资产注册 ============
    function registerHousehold(
        uint256 solarKW,
        uint256 batteryKWh,
        bool joinVPP
    ) external {
        require(solarKW > 0 || batteryKWh > 0, "Must have at least one asset");
        
        householdAssets[msg.sender] = HouseholdAsset({
            solarCapacity: solarKW,
            batteryCapacity: batteryKWh,
            vppParticipation: joinVPP ? 1 : 0,
            energyCredit: 0,
            isActive: true
        });
        
        registeredHouseholds.push(msg.sender);
        
        // 发行对应的资产代币
        uint256 solarTokens = _issueSolarTokens(msg.sender, solarKW);
        uint256 batteryTokens = _issueBatteryTokens(msg.sender, batteryKWh);
        
        // 初始能源积分奖励
        uint256 initialCredit = _calculateInitialCredit(solarKW, batteryKWh);
        householdAssets[msg.sender].energyCredit = initialCredit;
        
        emit HouseholdRegistered(msg.sender, solarTokens, batteryTokens, initialCredit);
    }
    
    // ============ 内部函数 ============
    function _issueSolarTokens(address recipient, uint256 solarKW) internal pure returns (uint256) {
        // 每1kW装机容量 = 1000代币（简化）
        return solarKW * 1000;
    }
    
    function _issueBatteryTokens(address recipient, uint256 batteryKWh) internal pure returns (uint256) {
        // 每1kWh = 100代币（简化）
        return batteryKWh * 100;
    }
    
    function _calculateInitialCredit(uint256 solarKW, uint256 batteryKWh) internal pure returns (uint256) {
        // 初始积分 = 光伏容量 * 10 + 储能容量 * 5
        return solarKW * 10 + batteryKWh * 5;
    }
    
    // ============ 查询函数 ============
    function getHouseholdCount() external view returns (uint256) {
        return registeredHouseholds.length;
    }
    
    function getHouseholdInfo(address _owner) external view returns (HouseholdAsset memory) {
        return householdAssets[_owner];
    }
}
