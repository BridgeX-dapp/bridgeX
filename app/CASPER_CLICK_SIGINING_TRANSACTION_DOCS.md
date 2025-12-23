# Signing transactions

Applications interacting with the Casper Network must submit transactions. Every transaction requires explicit user approval, which is done by digitally signing it.

Your frontend application is not always responsible for creating the transaction. Depending on your architecture, a transaction may be constructed by your backend service, or even by a third party, before being sent to the user for approval.

Typically, you'll handle a transaction without approvals. And such approval is what you want to get from the user. Then, the transaction will be ready to be processed by a Casper node.

The CSPR.click SDK provides two ways to obtain this approval:

1. [`send()`](https://docs.cspr.click/reference/methods#send).

* Requests the active wallet to prompt the user for approval (signature).
* Automatically submits the signed transaction to a Casper node for processing.
* Optionally accepts a callback function to receive live status updates during execution (e.g., pending, confirmed, rejected).

This is the most common method. In most applications, you can simply call send() and use its result or the status updates to inform the user whether their transaction is being processed, or if it was rejected (by either the user or the network).

2. [`sign()`](https://docs.cspr.click/reference/methods#sign).

* Requests the active wallet to prompt the user for approval.
* Returns the signature value to your application, without submitting the transaction.

This method is intended for advanced scenarios, where you need the raw signature for custom workflows (e.g., off-chain processing, server-side validation, or multi-step transaction orchestration).

## Buy Alice a Coffee on testnet

In the React `create-react-app` [template ](https://docs.cspr.click/documentation/getting-started#create-a-new-project)we've added an example that shows how to request the approval for a transaction that sends to Alice (an imaginary colleague in our team) 50 CSPR testnet tokens;

<figure><img src="https://4098787943-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FMwTFKCda4irtFhY9tqGt%2Fuploads%2Fgit-blob-e6956e436715a1649f6ad96cf72ec68e8e73df8b%2Fimage%20(6).png?alt=media" alt=""><figcaption><p>Example in the template project</p></figcaption></figure>

Take a look into the `<BuyMeACoffee>` component. Here are the key parts:

1. **Build the transaction**

First, construct a transfer transaction. Thecasper-js-sdk is included in this template to help you with this step. Refer to the official Casper SDK documentation for more detailed usage and examples.

2. **Send the transaction**

Next, call the clickRef.send() method. CSPR.click will:

* Prompt the user in the active wallet to review and sign the transaction.
* Forward the signed transaction to a Casper node for processing.

3. **Handle responses**

Your application should be prepared to handle all possible outcomes:

* Success: The transaction was sent and you receive a transaction hash.
* User rejection: The user declined to sign the transaction.
* Network rejection: The Casper node rejected the transaction.

You can handle responses using the .then() and .catch() blocks, or use the status updates as explained in the next step.

4. **(Optional) Track transaction status**

The `.send()` method accepts an optional callback function as its second argument. This callback receives transaction status updates while the transaction is being executed, enabling you to:

* Show progress indicators in your UI (e.g., “Transaction pending…”)
* Update users when the transaction is confirmed or fails
* Provide richer feedback beyond just the final outcome

```tsx
function BuyMeACoffee() {
  const clickRef = useClickRef();
  const activeAccount = clickRef?.getActiveAccount();
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [waitingResponse, setWaitingResponse] = useState<boolean>(false);

  const signAndSend = (transactionObj: object, sender: string) => {
          const onStatusUpdate = (status: string, data: any) => {
            console.log('STATUS UPDATE', status, data);
            if(status === TransactionStatus.SENT)
              setWaitingResponse(true);
          };
      
          clickRef
            ?.send(transactionObj, sender, onStatusUpdate)
            .then((res: SendResult | undefined) => {
                setWaitingResponse(false);
                if (res?.transactionHash) {
                    setTransactionHash(res.transactionHash);
                    alert('Transaction sent successfully: ' + res.transactionHash +
                        '\n Status: ' +
                        res.status +
                        '\n Timestamp: ' +
                        res.csprCloudTransaction.timestamp);
              } else if (res?.cancelled) {
                alert('Sign cancelled');
              } else {
                alert('Error in send(): ' + res?.error + '\n' + res?.errorData);
              }
            })
            .catch((err: any) => {
              alert('Error: ' + err);
              throw err;
            });
  };

  const handleSignTransaction = (evt: any) => {
    evt.preventDefault();
    const sender = activeAccount?.public_key?.toLowerCase() || '';
    const transaction = makeTransferTransaction(
            sender,
            recipientPk,
            '50' + '000000000',
            clickRef.chainName!
    );
    signAndSend(transaction as object, sender);
  };
	
  return (
    ...
    <button onClick={() => handleSignTransaction()} />Sign and send transaction</button>
    ...
  )
}
```
