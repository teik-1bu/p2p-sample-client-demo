//our username 
var name;
var connectedUser;
var enc = new TextEncoder();
var dec = new TextDecoder("utf-8");

const id = uuidv4()

//connecting to our signaling server 
var conn = new WebSocket(`ws://localhost:9090?id=${id}`);
conn.binaryType = "arraybuffer"

conn.onopen = function () {
    console.log("Connected to the signaling server");
};

//when we got a message from a signaling server 
conn.onmessage = function (msg) {
    console.log("Got message", decrypt(msg.data));

    var data = JSON.parse(decrypt(msg.data));

    switch (data.type) {
        case "login":
            handleLogin(data.success);
            break;
        //when somebody wants to call us 
        case "offer":
            handleOffer(data.offer, data.name);
            break;
        case "answer":
            handleAnswer(data.answer);
            break;
        //when a remote peer sends an ice candidate to us 
        case "candidate":
            handleCandidate(data.candidate);
            break;
        case "leave":
            handleLeave();
            break;
        default:
            break;
    }

};

conn.onerror = function (err) {
    console.log("Got error", err);
};

// ****************************************************** 
// Helper block
// ****************************************************** 

/**
 * Encrypt and decrypt data by XOR
 * @param {*} data 
 * @param {*} key 
 */
function cryptoraphy(data, key) {
    console.log(data)
    var dataLength = data.byteLength
    let result = new Uint8Array(dataLength)
    for (var i = 0; i < dataLength; i++) {
        console.log(data[i])
        result[i] = data[i] ^ key[i % key.byteLength]
    }
    return result
}


/**
 * Convert string to hex
 * @param {*} str 
 */
function str2hex(str) {
    let hex = ""
    try {
        hex = unescape(encodeURIComponent(str))
            .split('').map(function (v) {
                return v.charCodeAt(0).toString(16)
            }).join('')
    }
    catch (e) {
        hex = str
        console.log('invalid text input: ' + str)
    }
    return hex
}


/**
 * Convert buffer array to hex
 * @param {*} buffer 
 */
function buf2hex(buffer) { // buffer is an ArrayBuffer
    return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

//alias for sending JSON encoded messages 
function send(message) {
    //attach the other peer username to our messages 
    if (connectedUser) {
        message.name = connectedUser;
    }

    conn.send(encrypt(message));
};

function encrypt(msg) {
    key = enc.encode(id);
    var typedArray = new Uint8Array(str2hex(JSON.stringify(msg)).match(/[\da-f]{2}/gi).map(function (h) {
        return parseInt(h, 16)
    }))

    return new Uint8Array(cryptoraphy(typedArray, key))
}

function decrypt(msg) {
    key = enc.encode(id);
    return dec.decode(cryptoraphy(msg, key))
}

function uuidv4() {
    "use strict";
    var searchValue = /[xy]/g;
    function replacer(v) {
        var u;
        u = 16 * Math.random() | 0;
        return ("x" === v ? u : 3 & u | 8).toString(16)
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(searchValue, replacer)
}

// ****************************************************** 
// UI selectors block
// ****************************************************** 

var loginPage = document.querySelector('#loginPage');
var usernameInput = document.querySelector('#usernameInput');
var loginBtn = document.querySelector('#loginBtn');

var callPage = document.querySelector('#callPage');
var callToUsernameInput = document.querySelector('#callToUsernameInput');
var callBtn = document.querySelector('#callBtn');

var hangUpBtn = document.querySelector('#hangUpBtn');
callPage.style.display = "none";

// Login when the user clicks the button 
loginBtn.addEventListener("click", function (event) {
    name = usernameInput.value;

    if (name.length > 0) {
        send({
            type: "login",
            name: name
        });
    }

});

function handleLogin(success) {

    if (success === false) {
        alert("Ooops...try a different username");
    } else {
        loginPage.style.display = "none";
        callPage.style.display = "block";

        //********************** 
        //Starting a peer connection 
        //********************** 
    }

};