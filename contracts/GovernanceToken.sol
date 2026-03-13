// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * GGT - GreenGrid Governance Token
 * 治理代币合约
 */
contract GovernanceToken is ERC20, ERC20Burnable, Ownable {
    
    // 代币分配
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 10亿枚
    
    uint256 public constant COMMUNITY_REWARD = 400_000_000 * 10**18;   // 40%
    uint256 public constant TEAM_ALLOCATION = 200_000_000 * 10**18;    // 20%
    uint256 public constant ECOSYSTEM_FUND = 150_000_000 * 10**18;     // 15%
    uint256 public constant INVESTORS = 100_000_000 * 10**18;          // 10%
    uint256 public constant LIQUIDITY = 50_000_000 * 10**18;            // 5%
    uint256 public constant PUBLIC_SALE = 100_000_000 * 10**18;         // 10%
    
    // 质押信息
    struct StakingInfo {
        uint256 amount;
        uint256 stakedAt;
        uint256 rewardDebt;
    }
    
    mapping(address => StakingInfo) public stakingInfo;
    uint256 public totalStaked;
    uint256 public rewardPerTokenStored;
    uint256 public lastUpdateTime;
    uint256 public baseAPR = 10; // 基础APR 10%
    
    // DAO治理
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 voteStart;
        uint256 voteEnd;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
    }
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    uint256 public proposalCount;
    
    // 收益分享
    address public revenuePool;
    uint256 public revenueShareRate = 30; // 30%分配给质押者
    
    // 事件
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event ProposalCreated(uint256 indexed id, address indexed proposer, string description);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support);
    
    constructor() ERC20("GreenGrid Token", "GGT") {
        // 初始分发
        _mint(msg.sender, PUBLIC_SALE);
    }
    
    // ============ 质押功能 ============
    function stake(uint256 _amount) external {
        require(_amount > 0, "Cannot stake 0");
        require(balanceOf(msg.sender) >= _amount, "Insufficient balance");
        
        _transfer(msg.sender, address(this), _amount);
        
        StakingInfo storage info = stakingInfo[msg.sender];
        
        // 更新奖励
        if (info.amount > 0) {
            uint256 pending = _calculatePendingReward(msg.sender);
            info.rewardDebt += pending;
        }
        
        info.amount += _amount;
        info.stakedAt = block.timestamp;
        totalStaked += _amount;
        
        emit Staked(msg.sender, _amount);
    }
    
    function unstake(uint256 _amount) external {
        StakingInfo storage info = stakingInfo[msg.sender];
        require(info.amount >= _amount, "Insufficient staked");
        
        // 先领取奖励
        _claimReward();
        
        info.amount -= _amount;
        totalStaked -= _amount;
        
        _transfer(address(this), msg.sender, _amount);
        
        emit Unstaked(msg.sender, _amount);
    }
    
    function _calculatePendingReward(address _staker) internal view returns (uint256) {
        StakingInfo storage info = stakingInfo[_staker];
        if (info.amount == 0) return 0;
        
        uint256 stakingDuration = block.timestamp - info.stakedAt;
        uint256 baseReward = info.amount * baseAPR * stakingDuration / (365 days * 100);
        
        // 忠诚度加成：每90天增加1%
        uint256 loyaltyMultiplier = 100 + (stakingDuration / (90 days));
        
        return baseReward * loyaltyMultiplier / 100;
    }
    
    function claimReward() external {
        _claimReward();
    }
    
    function _claimReward() internal {
        StakingInfo storage info = stakingInfo[msg.sender];
        uint256 pending = _calculatePendingReward(msg.sender) + info.rewardDebt;
        
        if (pending > 0) {
            info.rewardDebt = 0;
            info.stakedAt = block.timestamp;
            // 这里简化处理，实际需要从奖励池转Token
            emit RewardClaimed(msg.sender, pending);
        }
    }
    
    // ============ DAO治理 ============
    function createProposal(string memory _description) external returns (uint256) {
        proposalCount++;
        uint256 id = proposalCount;
        
        proposals[id] = Proposal({
            id: id,
            proposer: msg.sender,
            description: _description,
            voteStart: block.timestamp,
            voteEnd: block.timestamp + 5 days,
            forVotes: 0,
            againstVotes: 0,
            executed: false
        });
        
        emit ProposalCreated(id, msg.sender, _description);
        return id;
    }
    
    function vote(uint256 _proposalId, bool _support) external {
        Proposal storage proposal = proposals[_proposalId];
        require(block.timestamp >= proposal.voteStart, "Voting not started");
        require(block.timestamp <= proposal.voteEnd, "Voting ended");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");
        
        hasVoted[_proposalId][msg.sender] = true;
        
        // 投票权重 = 质押数量（简化）
        uint256 weight = stakingInfo[msg.sender].amount;
        require(weight > 0, "Must stake to vote");
        
        if (_support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }
        
        emit Voted(_proposalId, msg.sender, _support);
    }
    
    // ============ 查询 ============
    function getStakingInfo(address _user) external view returns (StakingInfo memory) {
        return stakingInfo[_user];
    }
    
    function getProposal(uint256 _id) external view returns (Proposal memory) {
        return proposals[_id];
    }
}
