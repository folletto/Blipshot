function JPEGEncoderThreaded(d) {
    function e(a, b, c, f, g) {
        b = new k(r, l, b, c, f);
        m[l] = b;
        l++;
        i.postMessage(JSON.stringify({
            command: g ? "cache_only": "encode_new",
            data: {
                cacheIndex: b._cachedImageIndex,
                quality: b.quality,
                cache: b._cache,
                width: a.width,
                height: a.height
            }
        }));
        a = a.data;
        g = a.length;
        c = new Array(g / 4 * 3);
        for (var h = 0, j = 0; j < g; j += 4) {
            c[h++] = n[a[j]];
            c[h++] = n[a[j + 1]];
            c[h++] = n[a[j + 2]]
        }
        a = c.join("");
        i.postMessage(a);
        return f ? b: true
    }
    function k(a, b, c, f, g) {
        a = a;
        this._cachedImageIndex = b;
        this._cache = g;
        this.quality = c;
        this.callback =
        f;
        this.encode = function(h) {
            if (h) this.quality = h;
            a._encodeCached(this._cachedImageIndex, this.quality, this.callback)
        }
    }
    var o,
    i = new Worker(d || "jpeg_encoder_threaded_worker.js"),
    l = 0,
    m = [],
    r = this,
    p = "json",
    q = 0,
    n = function() {
        for (var a = String.fromCharCode, b = new Array(256), c = 0; c < 256; c++) b[c] = a(c);
        return b
    } ();
    i.onmessage = function(a) {
        var b;
        if (p == "json") {
            b = JSON.parse(a.data);
            q = b.cacheIndex;
            p = "datauri"
        } else {
            b = m[q];
            var c = (new Date).getTime() - o;
            console.log("Threaded encoding time: " + c + "ms");
            b.callback("data:image/jpeg;base64," +
            btoa(a.data));
            b._cache || (m[q] = null);
            p = "json"
        }
    };
    this.encode = function(a, b, c, f) {
        o = (new Date).getTime();
        return e(a, b, c, f, false)
    };
    this.prepareImage = function(a, b, c) {
        return e(a, b, c, true, true)
    };
    this._encodeCached = function(a, b) {
        o = (new Date).getTime();
        i.postMessage(JSON.stringify({
            command: "encode_cached",
            data: {
                cacheIndex: a,
                quality: b
            }
        }))
    };
    this.clearCaches = function() {
        l = 0;
        m = [];
        i.postMessage(JSON.stringify({
            command: "clear_caches"
        }))
    }
}
function getImageDataFromImage(d) {
    d = typeof d == "string" ? document.getElementById(d) : d;
    var e = document.createElement("canvas");
    e.width = d.width;
    e.height = d.height;
    var k = e.getContext("2d");
    k.drawImage(d, 0, 0);
    return k.getImageData(0, 0, e.width, e.height)
};
