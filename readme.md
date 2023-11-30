# XMTP Answer Bot

An Express server that loads a wallet from a private key in `.env`,  listens for interactions to that address and responds accordingly.

This example implementation works with the [XMTP PIN Server](https://github.com/backseats/xmtp-pin-server) to faciliate the handling of event secrets and if you pass it a correct secret and PIN, it will send you a POAP link to mint.

## Deploy Instructions

This server needs to listen persistently to the XMTP network so it can't be deployed to Vercel or a similar just-in-time runtime. Fly.io or Heroku would be appropriate places to deploy this server and shouldn't incur much cost due to its lightweight implementation.

## Deploy

Can be deployed with `fly deploy` by [@backseats](https://twitter.com/backseats_eth)
