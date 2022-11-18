import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

import RealEstate from './abis/RealEstate.json'
import Deed from './abis/Deed.json'
import config from './config.json';
import NavBar from './component/NavBar';
import SearchBar from './component/SearchBar';
import Popup from './component/Popup';


function App() {
  const [account, setAccount] = useState(null)
  const [deed, setDeed] = useState(null)
  const [homes, setHomes] = useState([])
  const [provider, setProvider] = useState(null)
  
  const [home, setHome] = useState(null)
  const [click, setClick] = useState(false)

  const loadContractData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)
    const network = await provider.getNetwork()
    const realEstate = new ethers.Contract(config[network.chainId].RealEstate.address, RealEstate.abi, provider)
    const totalSupply = await realEstate.totalSupply()
    const homes = []

    for (var i = 1; i <= totalSupply; i++) {
      const uri = await realEstate.tokenURI(i)
      const response = await fetch(uri)
      const metadata = await response.json()
      homes.push(metadata)
    }setHomes(homes)
    console.log(homes)
    const deed = new ethers.Contract(config[network.chainId].Deed.address, Deed.abi, provider)
    setDeed(deed);

    window.ethereum.on('accountsChanged', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = ethers.utils.getAddress(accounts[0])
      setAccount(account);
    })
  }

  useEffect(() => {
    loadContractData()
  }, [])

  const popup = (home) => {
    setHome(home)
    click ? setClick(false) : setClick(true)
  }

  return (
    <div>
      <NavBar account={account} setAccount={setAccount}/>
      <SearchBar />
        <div className='cards_section'>
            <h3>Residences for Purchase</h3>

            <hr />

            <div className='cards'>
              {homes.map((home, index) => (
              <div className='card' key={index} onClick={() => popup(home)}>
                <div className='cardImage'>
                  <img src={home.image} alt={home.description}/>
                </div>
                <div className='cardInfo'>
                    <h4>{home.attributes[0].value} ETH</h4>
                    <p>
                      <strong>{home.attributes[2].value}</strong> bedrooms <br/>
                      <strong>{home.attributes[3].value}</strong> bathrooms <br/>
                      <strong>{home.attributes[4].value}</strong> SQM <br/>
                    </p>
                    <p>{home.attributes[1].value}</p>
                </div>
              </div>
              ))}
            </div>
        </div>
        {click && (
        <Popup home={home} provider={provider} account={account} deed={deed} popup={popup} />
      )}
    </div>
  );
}

export default App;
