#!/usr/bin/env node
const https = require('https');

const postData = JSON.stringify({
  embeds: [{
    title: `Deploying a new KittenSafe version ${process.env.BRANCH === 'beta' ? ' (beta)' : ''}`,
    url: process.env.URL || 'http://kittensafe.netlify.app/',
    timestamp: new Date().toISOString(),
    color: 0x01ad9f,
    footer: {
      text: 'deployed by Netlify CI',
      icon_url: 'https://docs.netlify.com/favicon-32x32.png'
    },
    fields: [{
      name: 'Repository HEAD commit',
      inline: true,
      value: process.env.COMMIT_REF ? `[silizias/kittensafe@${process.env.COMMIT_REF.substr(0,7)}](https://github.com/KittenApps/KittenSafe/commit/${process.env.COMMIT_REF})` : 'unknown'
    },{
      name: 'Branch',
      inline: true,
      value: process.env.BRANCH || 'unknown'
    },{
      name: 'compare with previous build',
      inline: true,
      value: process.env.COMMIT_REF ? `[${process.env.COMMIT_REF.substr(0,7)}..${process.env.CACHED_COMMIT_REF.substr(0,7)}](https://github.com/KittenApps/KittenSafe/compare/${process.env.COMMIT_REF}..${process.env.CACHED_COMMIT_REF})` : 'unknown'
    },{
      name: 'Deploy log',
      inline: true,
      value: process.env.DEPLOY_ID ? `[${process.env.DEPLOY_ID}](https://app.netlify.com/sites/kittensafe/deploys/${process.env.DEPLOY_ID})` : 'https://app.netlify.com/sites/kittensafe/deploys'
    },{
      name: 'Branch URL',
      inline: true,
      value: process.env.DEPLOY_PRIME_URL || 'unknown'
    },{
      name: 'Build URL (permalink for this version)',
      inline: false,
      value: process.env.DEPLOY_URL || 'unknown'
    }]
  }]
});

const url = `https://discordapp.com/api/webhooks/${process.env.DISCORD_WEBHOOK}`;
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
