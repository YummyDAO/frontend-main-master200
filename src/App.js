import React, { useEffect, useState } from 'react';
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import {ethers} from "ethers";
import contractAbi from './utils/contractABI.json';
import polygonLogo from './assets/polygonlogo.png';
import ethLogo from './assets/ethlogo.png';
import { networks } from './utils/networks';

// Constants
const TWITTER_HANDLE = 'tacofinancexyz';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const tld = '.learnweb3dao';
const CONTRACT_ADDRESS = '0xBDfe8D89bb954963AC5106A465613e7F607849cF';

const OpenSeaLink = (props) => {
	return (
		<a className="link" href={`https://testnets.opensea.io/assets/mumbai/${props.contract}/${props.mintId}`} target="_blank" rel="noopener noreferrer">
			<p className="underlined">{' '}{props.linkName}{' '}</p>
		</a>
	);
}

const App = () => {

	const [currentAccount, setCurrentAccount] = useState('');
	// Add some state data propertie
	const [domain, setDomain] = useState('');
	const [record, setRecord] = useState('');
	const [network, setNetwork] = useState('');
	const [editing, setEditing] = useState(false);
	const [mints, setMints] = useState([]);
	const [loading, setLoading] = useState(false);
	const [ amount, setAmount ] = useState('');
	const [ contributed, setContributed ] = useState('')  //setTorecieve
	const [ torecieve, settorecieve ] = useState('')

	const connectWallet = async () => {
		try {
			const { ethereum } = window;

			if (!ethereum) {
				alert("Get MetaMask -> https://metamask.io/");
				return;
			}

			// Fancy method to request access to account.
			const accounts = await ethereum.request({ method: "eth_requestAccounts" });
		
			// Boom! This should print out public address once we authorize Metamask.
			console.log("Connected", accounts[0]);
			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.log(error)
		}
	};

	const switchNetwork = async () => {
		if (window.ethereum) {
			try {
				// Try to switch to the Mumbai testnet
				await window.ethereum.request({
					method: 'wallet_switchEthereumChain',
					params: [{ chainId: '0xa4b11' }], // Check networks.js for hexadecimal network ids
				});
			} catch (error) {
				// This error code means that the chain we want has not been added to MetaMask
				// In this case we ask the user to add it to their MetaMask
				if (error.code === 4902) {
					try {
						await window.ethereum.request({
							method: 'wallet_addEthereumChain',
							params: [
								{	
									chainId: '0x82750',
									chainName: 'Scroll',
									rpcUrls: ['https://rpc.scroll.io'],
									nativeCurrency: {
											name: "SCROLL ETH",
											symbol: "ETH",
											decimals: 18
									},
									blockExplorerUrls: ["https://blockscout.scroll.io/"]
								},
							],
						});
					} catch (error) {
						console.log(error);
					}
				}
				console.log(error);
			}
		} else {
			// If window.ethereum is not found then MetaMask is not installed
			alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
		} 
	};

	const checkIfWalletIsConnected = async () => {
		// First make sure we have access to window.ethereum
		const { ethereum } = window;
	
		if (!ethereum) {
			console.log("Make sure you have MetaMask!");
			return;
		} else {
			console.log("We have the ethereum object", ethereum);
		}

		// Check if we're authorized to access the user's wallet
		const accounts = await ethereum.request({ method: 'eth_accounts' });

		// Users can have multiple authorized accounts, we grab the first one if its there!
		if (accounts.length !== 0) {
			const account = accounts[0];
			console.log('Found an authorized account:', account);
			setCurrentAccount(account);
		} else {
			console.log('No authorized account found');
		}

		// This is the new part, we check the user's network chain ID
		const chainId = await ethereum.request({ method: 'eth_chainId' });
		setNetwork(networks[chainId]);
		
		ethereum.on('chainChanged', handleChainChanged);
				
		// Reload the page when they change networks
		function handleChainChanged(_chainId) {
		window.location.reload();
		}
	};

	const mintDomain = async () => {
		// Don't run if the domain is empty
		if (!domain) { return }
		// Alert the user if the domain is too short
		if (domain.length < 3) {
			alert('Domain must be at least 3 characters long');
			return;
		}
		// Calculate price based on length of domain (change this to match your contract)	
		// 3 chars = 0.5 MATIC, 4 chars = 0.3 MATIC, 5 or more = 0.1 MATIC
		const price = domain.length === 3 ? '0.3' : domain.length === 5 ? '0.5' : '0.2';
		console.log("Minting domain", domain, "with price", price);
	  try {
		const { ethereum } = window;
		if (ethereum) {
		  const provider = new ethers.providers.Web3Provider(ethereum);
		  const signer = provider.getSigner();
		  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
	
				console.log("Going to pop wallet now to pay gas...")
		  let tx = await contract.create(domain, {value: ethers.utils.parseEther(price)});
		  // Wait for the transaction to be mined
				const receipt = await tx.wait();
	
				// Check if the transaction was successfully completed
				if (receipt.status === 1) {
					console.log("Domain minted! https://mumbai.polygonscan.com/tx/"+tx.hash);
					
					// Set the record for the domain
					tx = await contract.setDetails (domain, record);
					await tx.wait();
	
					console.log("Record set! https://mumbai.polygonscan.com/tx/"+tx.hash);
					// Call fetchMints after 2 seconds
				    setTimeout(() => {
					    fetchMints();
				    }, 5000);
					
					setRecord('');
					setDomain('');
				}
				else {
					alert("Transaction failed! Please try again");
				}
		}
	  }
	  catch(error){
		console.log(error);
	  }
	};

	const updateDomain = async () => {
		if (!record || !domain) { return }
		setLoading(true);
		console.log("Updating domain", domain, "with record", record);
		  try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
	
				let tx = await contract.setDetails(domain, record);
				await tx.wait();
				console.log("Record set https://mumbai.polygonscan.com/tx/"+tx.hash);
	
				fetchMints();
				setRecord('');
				setDomain('');
			}
		  } catch(error) {
			console.log(error);
		  }
		setLoading(false);
	};

	const renderNotConnectedContainer = () => (
		<div className="connect-wallet-container">
			<h2>Connect Wallet to Continue</h2>
			<button onClick={connectWallet} className="cta-button connect-wallet-button">
				Connect Wallet
			</button>
		</div>
  	);

	// Form to enter domain name and data

	const fetchMints = async () => {
		try {
			const { ethereum } = window;
			if (ethereum) {
				// You know all this
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
					
				// Get all the domain names from our contract
				const names = await contract.getAllNames();
					
				// For each name, get the record and the address
				const mintRecords = await Promise.all(names.slice(0,4).map(async (name) => {
				const mintRecord = await contract.getDetails(name);
				const owner = await contract.getAddress(name);
				return {
					id: names.indexOf(name),
					name: name,
					record: mintRecord,
					owner: owner,
				};
			}));
	
			console.log("MINTS FETCHED ", mintRecords);
			setMints(mintRecords);
			}
		} catch(error){
			console.log(error);
		}
	}


	const Buy = async () => {
		if (!amount) { return }
		try {
		  const { ethereum } = window;
		  if (ethereum) {
			const provider = new ethers.providers.Web3Provider(ethereum);
			const signer = provider.getSigner();
			const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
		
			  console.log("Going to pop wallet now to pay gas...")
			  const amount2 = ethers.utils.parseEther(amount);
			let tx = await contract.buyTokens(currentAccount, amount2 ,{value: ethers.utils.parseEther(amount)});
		  }
		}  
		catch(error){
		  console.log(error);
		  }
	  }
	
	  const Contributed = async () => {
		try {
		  const { ethereum } = window;
		  if (ethereum) {
			const provider = new ethers.providers.Web3Provider(ethereum);
			const signer = provider.getSigner();
			const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
			const names = await contract.getUserContribution(currentAccount);
			const ethValue = ethers.utils.formatEther(names.toString());
			console.log("Contributed ", ethValue);
			setContributed(ethValue);
		  }
		}  
		catch(error){
		  console.log(error);
		  }
	  }
	
	  const Torecieve = async () => {
		try {
		  const { ethereum } = window;
		  if (ethereum) {
			const provider = new ethers.providers.Web3Provider(ethereum);
			const signer = provider.getSigner();
			const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
			const tacotokens = await contract.getBalance();
			const ethValue1 = ethers.utils.formatEther(tacotokens.toString());
			console.log("TacoTokens ", ethValue1);
			settorecieve(ethValue1);
		  }
		}  
		catch(error){
		  console.log(error);
		  }
	  }
	
	// This will take us into edit mode and show us the edit buttons!
	const editRecord = (name) => {
		console.log("Editing record for", name);
		setEditing(true);
		setDomain(name);
	}

	const renderInputForm = () =>{
		// If not on Polygon Mumbai Testnet, render "Please connect to Polygon Mumbai Testnet"
	    if (network !== 'Scroll Mainnet') {
		    return (
			    <div className="connect-wallet-container">
					<h2>Please switch to Arbitrum</h2>
				    {/* This button will call our switch network function */}
				    <button className='cta-button mint-button' onClick={switchNetwork}>Click here to switch</button>
			    </div>
		    );
	    }
		return (
			<div className="ffContainer">
			<div className="contentContainerFull">
			  <div className="mew">
				  <div className="mew-inner">
				  <h1 className="p30">Taco Presale</h1>
					  <div className="mew-me">
					  <div className="mew1">
						  <div className="lolia">
							  <p className="lolia1">Presale Hardcap:</p>
							  <p className="lolia2">6.0 ETH</p>
						  </div>
						  <div className="lolia">
							  <p className="lolia1">Presale Softcap:</p>
							  <p className="lolia2">3 ETH</p>
						  </div>
						  <div className="lolia">
							  <p className="lolia1">Token sale rate:</p>
							  <p className="lolia2">$0.01 per token</p>
						  </div>
						  <div className="lolia">
						  <p className="lolia1">Contributed:</p>
							  <p className="lolia2">{contributed} ETH</p>
						  </div>
						  <div className="lolia">
						  <p className="lolia1">Taco Tokens to Recieve:</p>
							  <p className="lolia2">{torecieve} TACO</p>
						  </div>
						  <div className="lolia pb20">
						  <p className="lolia1">Airdrop bonus:</p>
							  <p className="lolia2">20% veTaco</p>
						  </div>
						  {/*<div className="lolia">
						  <p className="lolia1">Total amount Contributed:</p>
							  <p className="lolia2">0 ETH</p>
			</div>*/}
					  </div>
					  <div className="mew2">
						  <input type="text" className="we" placeholder="Enter amount in ETH" value={amount} onChange={e => setAmount(e.target.value)}></input>
						  {/*<p className="lolia2">You are purchasing 0 Taco for 0 ETH</p>*/}
						  <button className="lo1" onClick={Buy}>Buy Taco</button>
						  <button className="lo2" >Claim would be announced</button>
					  </div>
					  </div>
				  </div>
			  </div>
			</div>
		  </div>
	   );
	};

	useEffect(() => {
		checkIfWalletIsConnected();
	}, [])

	useEffect(() => {
		if (network === 'Arbitrum One') {
			//fetchMints();
			Torecieve();
			Contributed();
		}
	}, [currentAccount, network]);

  return (
		<div className="App">
			<div className="container">
				<div className="header-container">
					<header>
					<image alt="logo" class="appLogo1 appLogo"></image>
                        {/*<div className="left">
                            <p className="title">🐱‍👤 learnweb3dao Name Service</p>
  </div>*/}
						{/*<div className="right">
						    <img alt="Network logo" className="logo" src={ network.includes("Polygon") ? polygonLogo : ethLogo} />
							{ currentAccount ? <p> Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)} </p> : <p> Not connected </p> }
						</div>*/}
						<div className='right'>
							<div className="header_testnetDisclaimer__3ukzr">
								</div>
								<button className="MuiButtonBase-root MuiButton-root MuiButton-contained header_accountButton__rknsE MuiButton-containedPrimary MuiButton-disableElevation" tabindex="0" type="button">
									<span className="MuiButton-label">
									{ currentAccount ? <p className="MuiTypography-root header_headBtnTxt__2KTbN MuiTypography-body1"> Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)} </p> : <p> Not connected </p> }
										{/*<p >Connect Wallet</p>*/}
									</span>
									<span className="MuiTouchRipple-root"></span>
								</button>
						</div>
					</header>
					<div className="navigation_navigationContent__JHbeR">
					<div role="group" className="MuiToggleButtonGroup-root navigation_navToggles__3Sqh0">
					<button className="MuiButtonBase-root MuiToggleButton-root MuiToggleButtonGroup-grouped MuiToggleButtonGroup-groupedHorizontal navigation_navButton__3mM3q Mui-selected navigation_testChange__2b4R4 h60" tabindex="0" type="button" value="swap" aria-pressed="true">
						<span className="MuiToggleButton-label">
							<h2 className="MuiTypography-root navigation_subtitleText__38T7u MuiTypography-h2">Presale Home</h2>
							</span>
							<span className="MuiTouchRipple-root">
							</span>
					</button>
					<button className="MuiButtonBase-root MuiToggleButton-root MuiToggleButtonGroup-grouped MuiToggleButtonGroup-groupedHorizontal navigation_navButton__3mM3q Mui-selected navigation_testChange__2b4R4 h60" tabindex="0" type="button" value="swap" aria-pressed="true" href="https://testnet.tacofinance.xyz/">
						<span className="MuiToggleButton-label">
							<h2 className="MuiTypography-root navigation_subtitleText__38T7u MuiTypography-h2">Taco Testnet</h2>
							</span>
							<span className="MuiTouchRipple-root">
							</span>
					</button>
					</div>
					</div>
				</div>
				{!currentAccount && renderNotConnectedContainer()}
				{currentAccount && renderInputForm()}
				{/*mints && renderMints()*/}

                {/*<div className="footer-container">
					<img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
					<a
						className="footer-text"
						href={TWITTER_LINK}
						target="_blank"
						rel="noreferrer"
					>{`built with @${TWITTER_HANDLE}`}</a>
  </div>*/}
			</div>
		</div>
	);
}

export default App;
