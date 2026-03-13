const hre = require("hardhat");

async function main() {
  console.log("🚀 开始部署 GreenGrid 智能合约...\n");

  // 1. 部署治理代币 (GGT)
  console.log("📝 部署治理代币 GGT...");
  const GovernanceToken = await hre.ethers.getContractFactory("GovernanceToken");
  const ggt = await GovernanceToken.deploy();
  await ggt.deployed();
  console.log(`✅ GGT 已部署: ${ggt.address}\n`);

  // 2. 部署光伏资产代币
  console.log("📝 部署光伏资产代币 sRWA...");
  const SolarAssetToken = await hre.ethers.getContractFactory("SolarAssetToken");
  const srwa = await SolarAssetToken.deploy();
  await srwa.deployed();
  console.log(`✅ sRWA 已部署: ${srwa.address}\n`);

  // 3. 部署主系统合约
  console.log("📝 部署主系统合约...");
  const GreenGridTokenSystem = await hre.ethers.getContractFactory("GreenGridTokenSystem");
  const system = await GreenGridTokenSystem.deploy();
  await system.deployed();
  console.log(`✅ GreenGridTokenSystem 已部署: ${system.address}\n`);

  // 4. 配置系统
  console.log("⚙️ 配置系统...");
  await system.setGovernanceToken(ggt.address);
  await system.setSolarAssetToken(srwa.address);
  console.log("✅ 系统配置完成\n");

  // 输出部署摘要
  console.log("=".repeat(50));
  console.log("📋 部署摘要");
  console.log("=".repeat(50));
  console.log(`治理代币 (GGT): ${ggt.address}`);
  console.log(`光伏资产代币 (sRWA): ${srwa.address}`);
  console.log(`主系统合约: ${system.address}`);
  console.log("=".repeat(50));

  // 保存部署信息
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    contracts: {
      GovernanceToken: ggt.address,
      SolarAssetToken: srwa.address,
      GreenGridTokenSystem: system.address
    }
  };

  console.log("\n📄 部署信息已保存");
  
  return deploymentInfo;
}

main()
  .then((info) => {
    console.log("\n🎉 部署成功!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 部署失败:", error);
    process.exit(1);
  });
