const html = document.getElementsByTagName('html')[0];
const global = {
    fileSuffix: ".gmd",
    displayFileTypes: false,
    showDevFeatures: false
};

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

function setInputFilter(textbox, inputFilter) {     // thanks stackoverflow
    ["input", "keydown", "keyup", "mousedown", "mouseup", "select", "contextmenu", "drop"].forEach(function(event) {
      textbox.addEventListener(event, function() {
        if (inputFilter(this.value)) {
          this.oldValue = this.value;
          this.oldSelectionStart = this.selectionStart;
          this.oldSelectionEnd = this.selectionEnd;
        } else if (this.hasOwnProperty("oldValue")) {
          this.value = this.oldValue;
          this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
        } else {
          this.value = "";
        }
      });
    });
  }

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

            case "click":
                document.querySelector(args.obj).click();
                break;

            case "level-list":
                document.getElementById("level-list").clear();
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

            case "level-info":
                if (args.returnCode) {
                    if (args.returnCode.startsWith("import::")) {
                        let l;
                        if (args.returnCode === "import::__EXAMPLE") {
                            l = document.createElement("gmd-level");
                            const r = document.createElement("roll-over");
                            const t = document.createElement("roll-text");
                            const c = document.createElement("roll-content");

                            l.setAttribute("levelName", "Example Level");
                            l.setAttribute("levelPath", "C:/Windows/System32");
                            l.setAttribute("id", "import-example")

                            r.appendChild(t);
                            r.appendChild(c);

                            l.appendChild(r);

                            document.querySelector("imported-levels").appendChild(l);
                        } else {
                            l = document.getElementById(args.returnCode);
                        }

                        const levelInfo = Object.keys(args.info).map(k => {
                            if (!["Name", "Creator", "Description"].includes(k)) {
                                return `${k.replace(/\$/g," ")}: ${args.info[k]}<br>`;
                            } else {
                                return "";
                            }
                        }).join("");

                        l.querySelector("roll-over roll-text").innerHTML = l.getAttribute("levelName");
                        l.querySelector("roll-over roll-content").innerHTML = `
                            <text>${l.getAttribute("levelPath")}</text>
                            <br>
                            <h3>${args.info.Name} by ${args.info.Creator}</h3><br>
                            <text><t-dark>${args.info.Description ? '"' + args.info.Description + '"' : "<i>No description provided</i>"}</t-dark></text>
                            <br><br>
                            <roll-over>
                                <roll-text>View level info</roll-text>
                                <roll-content>
                                    <text>${levelInfo}</text>
                                </roll-content>
                            </roll-over>
                            <br><br>
                            <button onclick="GDShare.import({ name: '${l.getAttribute('levelName')}', path: '${l.getAttribute('levelPath')}' }, 'remove-import::${args.returnCode}' )">Import</button>
                            <button onclick="this.parentNode.parentNode.parentNode.remove()">Close</button>
                        `;
                    } else if (args.returnCode.startsWith("export::")) {

                        const levelInfo = Object.keys(args.info).map(k => {
                            if (!["Name", "Creator", "Description"].includes(k)) {
                                return `${k.replace(/\$/g," ")}: ${args.info[k]}<br>`;
                            } else {
                                return "";
                            }
                        }).join("");

                        splash(`
                        <h3>${args.info.Name} by ${args.info.Creator}</h3><br>
                        <text><t-dark>${args.info.Description ? '"' + args.info.Description + '"' : "<i>No description provided</i>"}</t-dark></text>
                        <br><br>
                        <roll-over>
                            <roll-text>View level info</roll-text>
                            <roll-content>
                                <text>${levelInfo}</text>
                            </roll-content>
                        </roll-over>
                        `);
                    }
                }
                break;

            case "switch-theme":
                switchTheme(args.data);
                break;

            case "rescale":
                reScaleApp(args.scale, false);
                break;

            case "checkbox-states":
                Object.keys(args.states).forEach(x => {
                    document.querySelector(`[saveID="${x}"]`).check(args.states[x]);
                });
                break;

            case "player-data":
                if (args.didntDecode) {
                    document.querySelector("welcome-message").innerHTML = args.data.title;
                    document.querySelector("w-small").innerHTML = args.data.sub;
                    document.querySelector("#stats-viewer").style.display = "none";
                } else {
                    document.querySelector("welcome-message").innerHTML = document.querySelector("welcome-message").innerHTML
                        .replace(/__PLAYERNAME/g, args.data.name)
                    document.querySelector("w-small").innerHTML = document.querySelector("w-small").innerHTML
                        .replace(/__PLAYERID/g, args.data.userID);
                    
                    let stats = "";
                    Object.keys(args.data.stats).forEach(k => {
                        stats += `${k.replace(/\$/g, " ")}: ${args.data.stats[k]}<br>`;
                    });
                    document.querySelector("user-stats").innerHTML = stats;
                }
                document.querySelector("home-screen").style.opacity = 1;
                break;

            case "show-tutorial":
                document.querySelector(`[link="${args.screen}"]`).switchTo();

                if (args.highlight) {
                    args.highlight.forEach(x => {
                        document.querySelector(x).classList.add("highlight");
                    });
                } else {
                    arr(document.querySelectorAll(".highlight")).forEach(x => {
                        x.classList.remove("highlight");
                    });
                }
                break;

            case "init":
                document.getElementById("version-text").innerHTML = 
                document.getElementById("version-text").innerHTML.replace(/__VERSION/g, args.obj.appVersion);
                document.querySelector(".version-title").innerHTML = 
                document.querySelector(".version-title").innerHTML.replace(/__VERSION/g, args.obj.appVersion);
                document.querySelector(".version-title").style.opacity = .4;
                if (!args.obj.production) document.getElementById("dev-toggle").check(true);
                break;

            case "returnCode":
                switch (args.code.split("::").shift()) {
                    case "remove-import":
                        console.log(args.code);
                        document.getElementById(args.code.substring(args.code.split("::").shift().length + 2)).remove();
                        break;
                }
                break;
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

function reScaleApp(s, ipc = true) {
    html.style.setProperty("--scale", s);
    if (ipc) { 
        ipcSend({ action: "save-to-data", key: "scale", val: s })
    } else {
        document.getElementById("scale-slider").setValue(s);
    };
}

function switchTheme(to) {
    to.split("\n").forEach(l => {
        const v = l.split(":").shift();
        const t = l.split(":").pop().trim();

        html.style.setProperty(`--color-${v}`, t);
        console.log(`--color-${v}: ${t}`);
    });
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

class CoolSlider extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const i = document.createElement("input");
        i.setAttribute("type", "range");
        i.setAttribute("min", this.getAttribute("min"));
        i.setAttribute("max", this.getAttribute("max"));
        i.setAttribute("step", this.getAttribute("inc"));
        i.value = this.getAttribute("val");
        this.appendChild(i);

        const t = document.createElement("slider-text");
        t.innerHTML = this.hasAttribute("valtype") ? i.value + this.getAttribute("valtype") : i.value;
        this.appendChild(t);

        i.addEventListener("input", () => {
            t.innerHTML = this.hasAttribute("valtype") ? i.value + this.getAttribute("valtype") : i.value;
        });

        if (this.hasAttribute("onrelease")) {
            i.setAttribute("onmouseup", this.getAttribute("onrelease"));
        }
    }

    setValue(val) {
        const i = this.querySelector("input");
        this.children[0].value = val;
        this.children[1].innerHTML = this.hasAttribute("valtype") ? i.value + this.getAttribute("valtype") : i.value;
    }
}

customElements.define("hyper-link", HyperLink);
customElements.define("cool-slider", CoolSlider);

setInputFilter(document.getElementById("analyze-id-input"), val => /^\d{0,8}$/.test(val));