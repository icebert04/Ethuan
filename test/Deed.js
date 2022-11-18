const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}


    describe('Deed', () => {
    let buyer, seller, inspector, lender
    let realEstate, deed

    beforeEach(async () => {
        [buyer, seller, inspector, lender] = await ethers.getSigners()

        const RealEstate = await ethers.getContractFactory('RealEstate')
        realEstate = await RealEstate.deploy()

        let transaction = await realEstate.connect(seller).mint('https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS')
        await transaction.wait()

        const Deed = await ethers.getContractFactory('Deed')
        deed = await Deed.deploy(
            realEstate.address,
            seller.address,
            inspector.address,
            lender.address
        )

        transaction = await realEstate.connect(seller).approve(deed.address, 1)
        await transaction.wait()

        transaction = await deed.connect(seller).list(1, buyer.address, tokens(10), tokens(5))
        await transaction.wait()

    })

describe("Deploy", () => {

    it('NFT Address', async() =>{
        const result = await deed.nftAddress()
        expect(result).to.be.equal(realEstate.address)
    })

    it('lender', async() =>{
        const result = await deed.lender()
        expect(result).to.be.equal(lender.address)
    })

    it('inspector', async() =>{
        const result = await deed.inspector()
        expect(result).to.be.equal(inspector.address)
    })

    it('seller', async() =>{
        const result = await deed.seller()
        expect(result).to.be.equal(seller.address)
    })
})

describe('Property Listing', () => {
    it('Updates to listed', async () => {
        const result = await deed.isListed(1)
        expect(result).to.be.equal(true)
    })
    it('Updates the Owner of the NFT', async () => {
        expect(await realEstate.ownerOf(1)).to.be.equal(deed.address)
    })
    
    it('Listing buyer', async () => {
        const result = await deed.buyer(1)
        expect(result).to.be.equal(buyer.address)
    })

    it('Listing deed amount', async () => {
        const result = await deed.deedAmount(1)
        expect(result).to.be.equal(tokens(5))
    })

    it('Listing purchase price', async () => {
        const result = await deed.purchasePrice(1)
        expect(result).to.be.equal(tokens(10))
    })
})
describe('Property Desposits', () => {
    it('Updates Balance', async () => {
        const transaction = await deed.connect(buyer).earnestDeposit(1, { value: tokens(5) })
        await transaction.wait()
        const result = await deed.getBalance()
        expect(result).to.be.equal(tokens(5))
        })
    })

    describe('Inspection Check', () => {
        it("Verifies Inspection check", async () => {
            const transaction = await deed.connect(inspector).updateInspectionStatus(1, true)
            await transaction.wait()
            const result = await deed.inspectionPassed(1)
            expect(result).to.be.equal(true)
        })
    })

    describe('Approval Check', () => {
        it("Verifies Approval check", async () => {
            let transaction = await deed.connect(buyer).approve(1)
            await transaction.wait()

            transaction = await deed.connect(seller).approve(1)
            await transaction.wait()

            transaction = await deed.connect(lender).approve(1)
            await transaction.wait()

            expect(await deed.approval(1, buyer.address)).to.be.equal(true)
            expect(await deed.approval(1, seller.address)).to.be.equal(true)
            expect(await deed.approval(1, lender.address)).to.be.equal(true)
        })
    })

    describe('Close Sale Check', async () => {
        beforeEach(async () => {
            let transaction = await deed.connect(buyer).earnestDeposit(1, {value: tokens(5)})
            await transaction.wait()
            transaction = await deed.connect(inspector).updateInspectionStatus(1, true)
            await transaction.wait()
            transaction = await deed.connect(buyer).approve(1)
            await transaction.wait()
            transaction = await deed.connect(seller).approve(1)
            await transaction.wait()
            transaction = await deed.connect(lender).approve(1)
            await transaction.wait()

            await lender.sendTransaction({ to: deed.address, value: tokens(5) })

            transaction = await deed.connect(seller).closeSale(1)
            await transaction.wait()
        })

        it("Updates the Owner of the NFT'", async () => {
            expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address)
        })
        it('Updates Balance', async () => {
            expect(await deed.getBalance()).to.be.equal(0)
        })
    })
})
