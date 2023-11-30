import axios from 'axios';
import dotenv from 'dotenv';
import express from 'express';
import { Client } from '@xmtp/xmtp-js';
import { getAddress } from 'ethers/lib/utils';
import { Wallet } from 'ethers';

dotenv.config();

const app = express();

// This is the wallet addres your users are messaging. Ensure:
// 1) It matches the PRIVATE_KEY in your .env file
// 2) it's on the XMTP network
const ETHEREUM_ADDRESS_TO_LISTEN = process.env.BOT_ADDRESS!;

const loadWallet = () => {
  try {
    return Wallet.fromMnemonic(process.env.PRIVATE_KEY as string)
  } catch (e) {
    throw new Error('No wallet file found')
  }
}

async function startListeningForMessages(address: string) {
    const client = await Client.create(loadWallet(), { env: 'production' });
    const stream = await client.conversations.streamAllMessages();

    for await (const message of stream) {
        if (getAddress(address) === getAddress(message.senderAddress)) continue;

        if (getAddress(message.conversation.clientAddress) === getAddress(address)) {
            if (!message?.content) {
              console.error('Message content is empty');
              continue;
            }

            // Ensure the message content is a 4-digit number
            if (/^\d{4}$/.test(message.content!)) {
                // Validate the PIN
                try {
                    const response = await axios.post('xmtp-pin-server.vercel.app/validatePIN', {
                        pin: message.content,
                        // databaseType: 'airtable'
                    });

                    const conversation = await client.conversations.newConversation(message.senderAddress);

                    if (response.data.statusCode === 200) {
                        const { code } = response.data;
                        await conversation.send(`Congrats! Mint your POAP at ${code}`);
                    } else {
                      await conversation.send("There was a problem with your PIN. Please make sure your key word is correct and try again.");
                    }

                } catch (error) {
                    console.error('Error validating PIN:', error);
                }

            } else {
                try {
                    const response = await axios.post('https://xmtp-pin-server.vercel.app/getPIN', {
                        secret: message.content
                    });

                    const pin = response.data;

                    // Reply to the sender with the received PIN
                    const conversation = await client.conversations.newConversation(message.senderAddress);

                    await conversation.send(`Your PIN is: ${pin}`);
                } catch (error) {
                    console.error('Error getting PIN:', error);
                }
            }
        }
    }
}

const hostname = "0.0.0.0";
const port = 3000;

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  startListeningForMessages(ETHEREUM_ADDRESS_TO_LISTEN);
});
