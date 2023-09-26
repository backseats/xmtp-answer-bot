import axios from 'axios';
import dotenv from 'dotenv';
import express from 'express';
import { Client } from '@xmtp/xmtp-js';
import { getAddress } from 'ethers/lib/utils';
import { Wallet } from 'ethers';

dotenv.config();

const app = express();

// This is the wallet addres your users are messaging.
// Ensure 1) It matches the PRIVATE_KEY in your .env and
// 2) it's on the XMTP network
const ETHEREUM_ADDRESS_TO_LISTEN = "0x15633a0799b44745e00542D90BBADAfF4E9B85E7";

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
                    const response = await axios.post('https://sour-gnu-50.deno.dev/pin/validate', {
                        pin: message.content
                    });

                    const conversation = await client.conversations.newConversation(message.senderAddress);

                    if (response.data.statusCode === 200) {
                        // TODO Update copy
                        await conversation.send("Congrats! Mint your POAP at gsthttps://poap.xyz/abc123");
                    } else {
                      await conversation.send("There was a problem with your PIN. Please make sure your key word is correct and try again.");
                    }

                } catch (error) {
                    console.error('Error validating PIN:', error);
                }

            } else {
                try {
                    const response = await axios.post('https://sour-gnu-50.deno.dev/pin/get', {
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
// const port: number = parseInt(process.env.PORT) || 3000;

app.listen(3000, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  startListeningForMessages(ETHEREUM_ADDRESS_TO_LISTEN);
});
