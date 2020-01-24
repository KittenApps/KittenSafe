const {scrypt, createCipheriv, randomBytes} = require('crypto');

exports.handler = (event, context, callback) => {
    const {key, timestamp} = JSON.parse(event.body);
    if (key.length > 250 || timestamp.length !== 24){
      return callback(null, {statusCode: 413, body: "Invalid parameter length!"});
    }

    const secret = process.env.APP_SECRET || '42kittens';
    console.log(`timestamp: ${timestamp}`)
    // console.log(`key: ${key} timestamp: ${timestamp} secret: ${secret}`)

    scrypt(timestamp, secret, 32, (err, k) => {
        if (err) throw err;
        // console.log(`scrypt key: ${k.toString('hex')}`);

        randomBytes(16, (err, iv) => {
            if (err) throw err;
            // console.log(`iv: ${iv.toString('hex')}`);

            const cipher = createCipheriv('aes-256-gcm', k, iv);
            let encrypted = cipher.update(key, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            // console.log(`encrypted key: ${encrypted}`);
            callback(null, {statusCode: 200, body: JSON.stringify({key: encrypted, iv: iv.toString('hex'), auth: cipher.getAuthTag().toString('hex'), timestamp: timestamp})});
        });
    });
}
