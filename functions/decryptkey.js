const {scrypt, createDecipheriv} = require('crypto');

exports.handler = (event, context, callback) => {
    const {key, iv, auth, timestamp} = JSON.parse(event.body);

    if (key.length > 250 || iv.length !== 32 || auth.length !== 32 || timestamp.length !== 24){
      return callback(null, {statusCode: 413, body: "Invalid parameter length!"});
    }

    if (new Date(timestamp) - new Date() > 15000) { // allow 15sec clock drift
        return callback(null, {statusCode: 403, body: "Time is not up!"});
    }

    const secret = process.env.APP_SECRET || '42kittens';
    console.log(`timestamp: ${timestamp}`)
    // console.log(`key: ${key} timestamp: ${timestamp} secret: ${secret}`)

    scrypt(timestamp, secret, 32, (err, k) => {
        if (err) throw err;
        // console.log(`scrypt key: ${k.toString('hex')}`);
        // console.log(`iv: ${iv} auth: ${auth}`);

        const decipher = createDecipheriv('aes-256-gcm', k, Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(auth, 'hex'));

        try {
            let decrypted = decipher.update(key, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            // console.log(`decrypted key: ${decrypted}`);
            callback(null, {statusCode: 200, body: JSON.stringify({key: decrypted})});
        } catch (e) {
            // console.log(`Error: ${e.message}`);
            callback(null, {statusCode: 400, body: "Invalid authTag!"});
        }
    });
}
