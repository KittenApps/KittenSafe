#!/usr/bin/env node
const https = require('https');

const postData = JSON.stringify({
  embeds: [{
    title: `Deploying a new KittenSafe version ${process.env.BRANCH === 'beta' ? ' (beta)' : ''}`,
    url: process.env.URL || 'http://kittensafe.netlify.com/',
    timestamp: new Date().toISOString(),
    color: 0x01ad9f,
    footer: {
      text: 'deployed by Netlify CI',
      icon_url: 'https://docs.netlify.com/favicon-32x32.png'
    },
    fields: [{
      name: 'Repository commit',
      inline: true,
      value: process.env.COMMIT_REF ? `https://bitbucket.org/silizias/kittensafe/commits/${process.env.COMMIT_REF.substr(0,7)}` : 'unknown'
    },{
      name: 'Branch',
      inline: true,
      value: process.env.BRANCH || 'unknown'
    },{
      name: 'Deploy log',
      inline: false,
      value: process.env.BUILD_ID ? `https://app.netlify.com/sites/kittensafe/deploys/${process.env.BUILD_ID}` : 'https://app.netlify.com/sites/kittensafe/deploys'
    },{
      name: 'Build URL',
      inline: true,
      value: process.env.DEPLOY_URL || 'unknown'
    },{
      name: 'Branch URL',
      inline: true,
      value: process.env.DEPLOY_PRIME_URL || 'unknown'
    }]
  }]
});

const url = 'https://discordapp.com/api/webhooks/686963727626403853/A5C1GU0RvIwCs4YdD0Gmecpf11526hwZwSlbuxjwnzI95ZgUOIEw6IJjAtL2JHDPIbRz';
const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(url, options, res => console.log(`STATUS: ${res.statusCode}`));
req.write(postData);
req.end();
