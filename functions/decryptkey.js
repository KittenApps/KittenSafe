const {scrypt, createDecipheriv} = require('crypto');

exports.handler = (event, context, callback) => {
    const {key, iv, auth, timestamp} = JSON.parse(event.body);

    if (new Date(timestamp) > new Date()) {
        callback(null, {statusCode: 403, body: "Time is not up!"});
    }

    const secret = process.env.APP_SECRET || '42kittens';
    console.log(`key: ${key} timestamp: ${timestamp} secret: ${secret}`)

    scrypt(timestamp, secret, 32, (err, k) => {
        if (err) throw err;
        console.log(`scrypt key: ${k.toString('hex')}`);
        console.log(`iv: ${iv} auth: ${auth}`);

        const decipher = createDecipheriv('aes-256-gcm', k, Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(auth, 'hex'));
        let decrypted = decipher.update(key, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        console.log(`decrypted key: ${decrypted}`);
        callback(null, {statusCode: 200, body: JSON.stringify({key: decrypted})});
    });
}
