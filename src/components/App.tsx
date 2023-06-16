import { useState, useEffect, useRef } from "react"
import SocialLogin from "@biconomy/web3-auth"
import { ChainId } from "@biconomy/core-types"
import { ethers } from "ethers"
import SmartAccount from "@biconomy/smart-account"
import { msgBoardContract, msgBoardABI } from "../../utils"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import Spinner from "./Spinner"

function App() {
  const [smartAccount, setSmartAccount] = useState<SmartAccount | null>(null)
  const [interval, enableInterval] = useState(false)
  const sdkRef = useRef<SocialLogin | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [provider, setProvider] = useState<any>(null)
  const [message, setMessage] = useState<string>("")
  const [contract, setContract] = useState<any>(null)
  const [allMessages, setAllMessages] = useState<string[]>([])

  useEffect(() => {
    let configureLogin: any
    if (interval) {
      configureLogin = setInterval(() => {
        if (!!sdkRef.current?.provider) {
          setupSmartAccount()
          clearInterval(configureLogin)
        }
      }, 1000)
    }
  }, [interval])

  useEffect(() => {
    getMessages()
  }, [])

  async function login() {
    if (!sdkRef.current) {
      const socialLoginSDK = new SocialLogin()
      const signature2 = await socialLoginSDK.whitelistUrl("http://localhost:3000/")
      const signature1 = await socialLoginSDK.whitelistUrl("https://aaboard.vercel.app")
      await socialLoginSDK.init({
        chainId: ethers.utils.hexValue(ChainId.POLYGON_MUMBAI).toString(),
        network: "testnet",
        whitelistUrls: {
          "http://localhost:3000/": signature2,
          "https://aaboard.vercel.app": signature1,
        },
      })
      await socialLoginSDK.init()
      console.log("socialLoginSDK =>", socialLoginSDK)

      sdkRef.current = socialLoginSDK
    }
    if (!sdkRef.current.provider) {
      sdkRef.current.showWallet()
      enableInterval(true)
    } else {
      setupSmartAccount()
    }
  }

  async function setupSmartAccount() {
    if (!sdkRef?.current?.provider) {
      return
    }
    sdkRef.current.hideWallet()
    setLoading(true)
    const web3Provider = new ethers.providers.Web3Provider(sdkRef.current.provider)
    setProvider(web3Provider)
    try {
      const smartAccount = new SmartAccount(web3Provider, {
        activeNetworkId: ChainId.POLYGON_MUMBAI,
        supportedNetworksIds: [ChainId.POLYGON_MUMBAI],
        networkConfig: [
          {
            chainId: ChainId.POLYGON_MUMBAI,
            dappAPIKey: "XRtYQSxgk.9b3abfcf-b407-4f91-a269-03959ea90bf1",
          },
        ],
      })
      const acct = await smartAccount.init()
      console.log({ deployed: await smartAccount.isDeployed(ChainId.POLYGON_MUMBAI) })
      const isDeployed = await smartAccount.isDeployed(ChainId.POLYGON_MUMBAI)
      if (isDeployed == false) {
        console.log("this one needs to be deployed")
        const deployTx = await smartAccount.deployWalletUsingPaymaster()
        console.log(deployTx)
      }
      setSmartAccount(acct)
      setLoading(false)
    } catch (err) {
      console.log("error setting up smart account... ", err)
    }
  }

  const logout = async () => {
    if (!sdkRef.current) {
      console.error("Web3Modal not initialized.")
      return
    }
    await sdkRef.current.logout()
    sdkRef.current.hideWallet()
    setSmartAccount(null)
    enableInterval(false)
  }

  const sendMessage = async () => {
    try {
      setLoading(true)
      const infoToast = toast.info("Sending your anonymous message...", {
        position: "top-right",
        autoClose: 25000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "dark",
      })
      console.log(contract)
      const addMsgTx = await contract.populateTransaction.addMessage(message)
      const tx1 = {
        to: msgBoardContract,
        data: addMsgTx.data,
      }
      const txResponse = await smartAccount?.sendTransaction({ transaction: tx1 })

      const txHash = await txResponse?.wait()
      console.log({ txHash })

      getMessages()
      toast.dismiss(infoToast)
      toast.success("Your anonymous message has been added!", {
        position: "top-right",
        autoClose: 15000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "dark",
      })
      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.log(error)
      toast.error("Error occured check the console", {
        position: "top-right",
        autoClose: 25000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "dark",
      })
    }
  }

  const getMessages = async () => {
    console.log(provider)
    const tempProvider = new ethers.providers.JsonRpcProvider("https://mumbai.rpc.thirdweb.com")
    const contract = new ethers.Contract(msgBoardContract, msgBoardABI, tempProvider)

    setContract(contract)

    let messages = await contract.getAllMessages()

    messages = [...messages].reverse()
    setAllMessages(messages)
  }
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value)
  }
  return (
    <div className="bg-fbg border- h-screen overflow-scroll">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <div className="flex flex-col bg-fbox m-16 rounded-lg min-h-full justify-center items-center py-8">
        <h1 className="text-5xl font-bold">Message board dApp</h1>
        <p className="text-md m-10 text-center ">
          This is a message board dApp powered by Account Abstraction <br />
          <br /> Login to send an anonymous message and view other messages as well! <br /> This dApp uses Gasless txns
          so you dont need to worry about any gas fees!
        </p>
        {!smartAccount && !loading && (
          <button className="btn" onClick={login}>
            Login
          </button>
        )}
        {!smartAccount && loading && (
          <div>
            <p>Creating your Smart Account...</p>
            <Spinner />
          </div>
        )}
        {!!smartAccount && (
          <>
            <div className="">
              <h3>Smart account address : {smartAccount.address}</h3>
            </div>

            <div className="flex flex-row w-full justify-center">
              {loading ? (
                <Spinner />
              ) : (
                <>
                  <input
                    className="border-2 rounded-md p-2 bg-black mx-4 w-1/2 mt-2"
                    type="text"
                    placeholder="Enter your message"
                    value={message}
                    onChange={handleChange}
                  />

                  <button className="rounded-lg bg-forange text-white px-4 hover:bg-orange-600" onClick={sendMessage}>
                    Send
                  </button>
                </>
              )}
            </div>
            <button className="btn mt-4" onClick={logout}>
              Logout
            </button>
            {!!allMessages && (
              <div className="bg-fmsg p-4 mt-8 w-1/2 rounded-md">
                <h2 className="text-center text-xl"> All Messages</h2>

                {allMessages.map((msg, key) => (
                  <div key={key} className="text-md border-forange border-b-2 py-2">
                    {msg}
                    <br className=" " />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App
