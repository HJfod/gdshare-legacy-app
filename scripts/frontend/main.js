const html = document.getElementsByTagName('html')[0];

function arr(list) {
    return Array.prototype.slice.call(list);
}

function ipcSend(msg) {
    window.postMessage({
        protocol: "to-app",
        data: msg
    });
}

function getCSS(v) {
    let g = (getComputedStyle(html).getPropertyValue(v)).replace('px', '');
    if (g.indexOf("calc(") > -1) {
        g = g.split("*");
        for (let i in g) {
            g[i] = g[i].replace(/calc\(/g, "");
            g[i] = g[i].replace(/\)/, "");
            g[i] = g[i].trim();
            g[i] = Number(g[i]);
        }
        g = g[0] * g[1];
    }
    if (isNaN(g)) {
        return g;
    } else {
        return Number(g);
    }
}

window.addEventListener("message", event => {
	const message = event.data;
	console.log(message.data);
    if (message.protocol === "from-app") {
        let args = JSON.parse(message.data);
        switch (args.action) {
            case "test":
                alert(args.msg);
                break;
        }
    }
});

function splash(message) {
    const a = document.querySelector("alert-box");
    message.startsWith("<") ? a.innerHTML = message : a.innerHTML = `<text>${message}</text>`;
    a.style.display = "initial";
}