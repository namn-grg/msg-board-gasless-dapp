import React, { useState, useEffect } from "react"
import { BigNumber, ethers } from "ethers"
import { msgBoardABI, msgBoardContract } from "../../utils"
import SmartAccount from "@biconomy/smart-account"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

interface Props {
  smartAccount: SmartAccount
  provider: any
  loading: boolean
}

const Minter: React.FC<Props> = ({ smartAccount, provider, loading }) => {
  const [nftContract, setNFTContract] = useState<any>(null)
  const [nftCount, setNFTCount] = useState<number>(0)

  useEffect(() => {
    getNFTCount()
  }, [])

  if (loading) {
    return <div />
  }

  const getNFTCount = async () => {
    const contract = new ethers.Contract(msgBoardContract, msgBoardABI, provider)
    setNFTContract(contract)
    const count = await contract.getAllMessages()
    console.log({ count })
    // setNFTCount(count.toNumber());
  }

  const mintNFT = async () => {
    try {
      const infoToast = toast.info("Sending your anon message...", {
        position: "top-right",
        autoClose: 25000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "dark",
      })
      const contract = new ethers.Contract(msgBoardContract, msgBoardABI, provider)
      console.log(contract)
      const addMsgTx = await contract.populateTransaction.addMessage("message")
      const tx1 = {
        to: msgBoardContract,
        data: addMsgTx.data,
      }
      const txResponse = await smartAccount?.sendTransaction({ transaction: tx1 })

      const txHash = await txResponse?.wait()
      console.log({ txHash })

      getNFTCount()
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
    } catch (error) {
      console.log(error)
      toast.error("error occured check the console", {
        position: "top-right",
        autoClose: 25000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      })
    }
  }

  const nftURL = `https://testnets.opensea.io/${smartAccount.address}`

  return (
    <div>
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
      <button className="" onClick={() => mintNFT()}>
        Mint NFT
      </button>
      {nftCount ? <p>You own {nftCount} NFTs </p> : null}
      <p>
        View your NFTs{" "}
        <a className="" href={nftURL} target="_blank">
          here
        </a>{" "}
        after minting{" "}
      </p>
    </div>
  )
}

export default Minter
