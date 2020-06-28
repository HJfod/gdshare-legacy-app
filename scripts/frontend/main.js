const html = document.getElementsByTagName('html')[0];
const global = {};

function arr(list) {
    return Array.prototype.slice.call(list);
}

function ipcSend(msg) {
    if (typeof msg === "string") msg = JSON.parse(msg);
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

const GDShare = {
    exportPath: "",
    imports: "",
    export(level = false) {
        ipcSend({ 
            action: "level-export",
            from: false,
            path: this.exportPath,
            levels: level ? level : document.querySelector("#level-list").getValue()
        });
    },
    import(level = false) {
        const imp = []; 
        this.imports.forEach(f => imp.push({ name: f.name, path: f.path.replace(/\\/g,"/") }));
        
        ipcSend({ 
            action: "level-import",
            to: false,
            levels: imp
        });
    },
    selectExportPath() {
        ipcSend({
            action: "select-path",
            title: "Select export path",
            dir: true,
            returnCode: "export-path"
        });
    },
    setExportPath(to) {
        this.exportPath = to;
        document.getElementById("export-path").innerHTML = to;
    }
};

window.addEventListener("message", event => {
	const message = event.data;
    if (message.protocol === "from-app") {
        let args = JSON.parse(message.data);
        switch (args.action) {
            case "test":
                alert(args.msg);
                break;
            case "info":
                splash(args.msg);
                break;
            case "level-list":
                args.levels.forEach(l => document.getElementById("level-list").addOption(l.name));
                document.getElementById("level-list").search("");
                break;
            case "path-selected":
                switch (args.code) {
                    case "export-path":
                        GDShare.setExportPath(args.path);
                        break;
                }
                break;
            case "player-data":
                document.querySelector("welcome-message").innerHTML = document.querySelector("welcome-message").innerHTML
                    .replace(/__PLAYERNAME/g, args.data.name)
                document.querySelector("w-small").innerHTML = document.querySelector("w-small").innerHTML
                    .replace(/__PLAYERID/g, args.data.userID);
                
                let stats = "";
                Object.keys(args.data.stats).forEach(k => {
                    stats += `${k.replace(/\$/g, " ")}: ${args.data.stats[k]}<br>`;
                });
                document.querySelector("user-stats").innerHTML = stats;

                document.querySelector("home-screen").style.opacity = 1;
                break;
            case "init":
                document.getElementById("version-text").innerHTML = 
                document.getElementById("version-text").innerHTML.replace(/__VERSION/g, args.obj.appVersion);
                document.querySelector(".version-title").innerHTML = 
                document.querySelector(".version-title").innerHTML.replace(/__VERSION/g, args.obj.appVersion);
                document.querySelector(".version-title").style.opacity = .4;
                if (!args.obj.production) document.getElementById("dev-toggle").check(true);
        }
    }
});

function splash(message) {
    document.querySelector("loading-text").style.display = "none";

    if (typeof(message) === "object") {
        if (message.type === "loading") {
            document.querySelector("alert-area").style.display = "initial";
            document.querySelector("alert-box").style.display = "none";
            document.querySelector("loading-circle").style.display = "initial";
            if (message.msg) {
                document.querySelector("loading-text").style.display = "initial";
                document.querySelector("loading-text").innerHTML = message.msg;
            }
        } else if (message.type === "close") {
            document.querySelector("alert-area").style.display = "none";
        }
    } else {
        const a = document.querySelector("alert-box").querySelector("alert-content");
        message.startsWith("<") ? a.innerHTML = message : a.innerHTML = `<text>${message}</text>`;
        document.querySelector("alert-area").style.display = "initial";
        document.querySelector("alert-box").style.display = "initial";
        document.querySelector("loading-circle").style.display = "none";
    }
}

class HyperLink extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        if (this.hasAttribute("link")) {
            this.addEventListener("click", () => {
                ipcSend({ action: "open-link", link: this.getAttribute("link") });
            });
        }
    }
}

customElements.define("hyper-link", HyperLink);