import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

import X from '../asset/X.svg';

const Popup = ({ home, provider, account, deed, popup }) => {
    const [hasBought, setHasBought] = useState(false)
    const [hasLended, setHasLended] = useState(false)
    const [hasInspected, setHasInspected] = useState(false)
    const [hasSold, setHasSold] = useState(false)

    const [buyer, setBuyer] = useState(null)
    const [lender, setLender] = useState(null)
    const [inspector, setInspector] = useState(null)
    const [seller, setSeller] = useState(null)

    const [owner, setOwner] = useState(null)

    const fetchDetails = async () => {

        const buyer = await deed.buyer(home.id)
        setBuyer(buyer)

        const hasBought = await deed.approval(home.id, buyer)
        setHasBought(hasBought)


        const seller = await deed.seller()
        setSeller(seller)

        const hasSold = await deed.approval(home.id, seller)
        setHasSold(hasSold)


        const lender = await deed.lender()
        setLender(lender)

        const hasLended = await deed.approval(home.id, lender)
        setHasLended(hasLended)


        const inspector = await deed.inspector()
        setInspector(inspector)

        const hasInspected = await deed.inspectionPassed(home.id)
        setHasInspected(hasInspected)
    }

    const fetchOwner = async () => {
        if (await deed.isListed(home.id)) return

        const owner = await deed.buyer(home.id)
        setOwner(owner)
    }

    const buyHandler = async () => {
        const deedAmount = await deed.deedAmount(home.id)
        const signer = await provider.getSigner()
        let transaction = await deed.connect(signer).earnestDeposit(home.id, { value: deedAmount })
        await transaction.wait()
        transaction = await deed.connect(signer).closeSale(home.id)
        await transaction.wait()
        console.log(deedAmount)
        setHasBought(true)
    }

    const inspectHandler = async () => {
        const signer = await provider.getSigner()
        const transaction = await deed.connect(signer).updateInspectionStatus(home.id, true)
        await transaction.wait()

        setHasInspected(true)
    }

    const lenderHandler = async () => {
        const signer = await provider.getSigner()
        const transaction = await deed.connect(signer).closeSale(home.id)
        await transaction.wait()
        const lendAmount = (await deed.purchasePrice(home.id) - await deed.deedAmount(home.id))
        await signer.sendTransaction({ to: deed.address, value: lendAmount.toString(), gasLimit: 60000 })

        setHasLended(true)
    }

    const sellHandler = async () => {
        const signer = await provider.getSigner()
        let transaction = await deed.connect(signer).closeSale(home.id)
        await transaction.wait()
        transaction = await deed.connect(signer).finalizeSale(home.id)
        await transaction.wait()

        setHasSold(true)
    }

    useEffect(() => {
        fetchDetails()
        fetchOwner()
    }, [hasSold])

    return (
        <>
        <div className="pop">

            <div className='popDetails'>
                <div className='popImage'>
                    <img src={home.image} alt={home.description}/>
                </div>
                <div className='pop_overview'>
                    <h1>{home.name}</h1>
                    <p>
                      <strong>{home.attributes[2].value}</strong> bedrooms <br/>
                      <strong>{home.attributes[3].value}</strong> bathrooms <br/>
                      <strong>{home.attributes[4].value}</strong> SQM <br/>
                    </p>
                    <br/>
                    <p>{home.attributes[1].value}</p>
                    <h2>{home.attributes[0].value} ETH</h2>
                    {owner ? (
                        <div className='pop_owned'>
                            Owned by {owner.slice(0, 6) + '...' + owner.slice(38, 42)}
                        </div>
                    ) : (
                        <div>
                            {(account === inspector) ? (
                                <button className='pop_buy' onClick={inspectHandler} disabled={hasInspected}>
                                    Confirm Inspection
                                </button>
                            ) : (account === lender) ? (
                                <button className='pop_buy' onClick={lenderHandler} disabled={hasLended}>
                                    Confirm & Lend
                                </button>
                            ) : (account === seller) ? (
                                <button className='pop_buy' onClick={sellHandler} disabled={hasSold}>
                                    Confirm Sell
                                </button>
                            ) : (
                                <button className='pop_buy' onClick={buyHandler} disabled={hasBought}>
                                    Buy
                                </button>
                            )}

                            <button className='pop_agent'>
                                Contact agent
                            </button>
                        </div>
                    )}

                    <hr/>


                    <h2>Overview</h2>
                    <p>{home.description}</p>   
                    <hr/>

                    <h2>Features</h2>

                    <u className='featuresList' >
                        {home.attributes.map((attribute, index) => (
                            <li key={index}><strong>{attribute.trait_type}</strong> : {attribute.value}</li>
                        ))}
                    </u>

                </div>
                <button onClick={popup} className="popClose">
                    <img src={X} alt="exit pop-up"/>
                </button>
            </div>
        </div>
        </>
    );
}

export default Popup;