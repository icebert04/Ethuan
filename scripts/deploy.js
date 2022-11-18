const { hre, ethers } = require("hardhat");

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
  }
  
async function main() {
    [buyer, seller, inspector, lender] =await ethers.getSigners()
    const RealEstate = await ethers.getContractFactory('RealEstate')
    const realEstate = await RealEstate.deploy()
    await realEstate.deployed()

    console.log(`Deployed Ethuan Real Estate Contract at: ${realEstate.address}`)
    console.log(`Minting 3 property NFTs...\n`)

    for (let i = 0; i < 3; i++) {
        const transaction = await realEstate.connect(seller).mint(`https://gateway.pinata.cloud/ipfs/Qmd8mpf3DEXKfgKjHZ9ZFSjozvFBFEHASF2JjsusKZNYjT/${i + 1}.json`)
        await transaction.wait()
    }

    const Deed = await ethers.getContractFactory('Deed')
    const deed = await Deed.deploy(
      realEstate.address,
      seller.address,
      inspector.address,
      lender.address
    )
    await deed.deployed()

    console.log(`Deployed Deed Contract at: ${deed.address}`)
    console.log(`Listing 3 property NFTs...\n`)
  
    for (let i = 0; i < 3; i++) {
      let transaction = await realEstate.connect(seller).approve(deed.address, i + 1)
      await transaction.wait()
    }
  
    transaction = await deed.connect(seller).list(1, buyer.address, tokens(20), tokens(10))
    await transaction.wait()
  
    transaction = await deed.connect(seller).list(2, buyer.address, tokens(15), tokens(5))
    await transaction.wait()
  
    transaction = await deed.connect(seller).list(3, buyer.address, tokens(10), tokens(5))
    await transaction.wait()
  
    console.log(`Finished.`)
  }

  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });