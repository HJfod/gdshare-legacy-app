function dog(appv) {
    return new Promise((resolve, reject) => {
        const https = require('https');
        let o = {
            hostname: `api.github.com`,
            path: `/repos/HJfod/gdshare/releases/latest`,
            headers: {
                'User-Agent': 'request'
            }
        }

        https.get(o, res => {
            if (res.statusCode !== 200){
                console.log("HTTPS request failed" + res.statusCode);
                reject({ error: "not-200", code: res.statusCode });
            } else {
                let rawData = '';
                res.on('data', chunk => rawData += chunk );
                res.on('end', () => {
                    console.log("HTTPS result received");
                    try {
                        const parsedData = JSON.parse(rawData);
                        let newv = parsedData.tag_name.replace("v","");
                        if (newv === appv){
                            resolve({ status: "up-to-date" })
                        }else{
                            if (Number(newv.replace(/\./g,"")) > Number(appv.replace(/\./g,""))){
                                resolve({ status: "new-available", newVer: newv, oldVer: appv, notes: parsedData.body.replace(/\*\*\*(.*?)\*\*\*/g,""), important: parsedData.body.match(/\*\*\*(.*?)\*\*\*/) });
                            }else{
                                resolve({ status: "upper-to-date", newVer: newv, oldVer: appv });
                            }
                        }
                    } catch (e) {
                        reject({ error: "cant-parse", msg: e.message });
                    }
                });
            }
        });
    });
}

module.exports = {
    dog
}