function ksOCR(opt) {
    opt = opt || {}
    var DATA = { };
    DATA.threshold = opt.threshold || 125;
    DATA.array_image = [];
    DATA.array_image_width = 0;
    DATA.array_image_height = 0;
    DATA.weight = {};
    DATA.weight_width = opt.weight_width || 30;
    DATA.weight_height = opt.weight_height || 30;
    DATA.metrix_old = [];
    DATA.metrix_new = [];
    DATA.text = "";
    this.Recognize = function(callback) {
        var input = document.createElement('input');
        input.setAttribute("type", "file");
        input.addEventListener('change', function (event) {
            var target = event.target;
            var reader = new FileReader();
            reader.onload = function (e) {
                var url = e.target.result;
                recognize(url, callback);
            };
            reader.readAsDataURL(target.files[0]);
        }, false);
        input.click();
    }
    this.RecognizeUrl = function(url, callback) {
        recognize(url, callback);
    }
    this.Test = function(metrix) {
        return test_weight(metrix);
    }
    this.Train = function(metrix, char) {
        train_weight(metrix, char);
        alert("Success.");
    }
    this.Reset = function() {
        localStorage.removeItem("ocr_weight");
        alert("Success.");
    }
    this.Load = function() {
        var data = JSON.stringify(DATA.weight);
        var a = document.createElement('a');
        var blob = new Blob([data], {type: 'text/plain'});
        a.href = window.URL.createObjectURL(blob);
        a.setAttribute("download", "ocr_weight.txt");
        a.click();
    }
    this.Upload = function() {
        var input = document.createElement('input');
        input.setAttribute("type", "file");
        input.addEventListener('change', function (event) {
            var target = event.target;
            var reader = new FileReader();
            reader.onload = function(){
                var text = reader.result;
                try {
                    var weight = JSON.parse( text );
                    DATA.weight = weight;
                    save_weight();
                    alert("Success.");
                } catch(e) {
                    alert("No format");
                }
            };
            reader.readAsText(target.files[0]);
        }, false);
        input.click();
    }
    var load_weight = function() {
        DATA.weight = {};
        var data = localStorage.getItem("ocr_weight");
        if( data && data!="" ) {
            try {
                var obj = JSON.parse( data );
                DATA.weight = obj;
            } catch(e) {  }
        }
    }
    var save_weight = function() {
        localStorage.setItem("ocr_weight", JSON.stringify(DATA.weight) );
    }
    var recognize = function(url, callback) {
        DATA.text = "";
        var img = new Image();
        img.onload = function() {
            DATA.array_image_width = this.width;
            DATA.array_image_height = this.height;
            var canvas = document.createElement("canvas");
            canvas.width = DATA.array_image_width;
            canvas.height = DATA.array_image_height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(this, 0, 0);
            var idata = ctx.getImageData(0, 0, DATA.array_image_width, DATA.array_image_height);
            DATA.array_image = get_array_image(idata);
            process_metrix();
            var line = DATA.metrix_new.length;
            for (var i = 0; i < line; i++ ) {
                var ch = DATA.metrix_new[i].length;
                for (var j = 0; j < ch; j++ ) {
                    var char = test_weight( DATA.metrix_new[i][j] );
                    DATA.text += char;
                }
                DATA.text += "\n";
            }
            if(callback) callback(DATA);
        };
        img.src = url;
    }
    var get_array_image = function(idata) {
        var array_image = [];
        var len = idata.data.length;
        var v = [];
        var row = 0;
        var col = 0;
        for (var i = 0; i < len; i += 4) {
            var gray = 0.3*idata.data[i] + 0.59*idata.data[i+1] + 0.11*idata.data[i+2];
            if( gray <= DATA.threshold ) {
                v[col++] = 1;
            } else {
                v[col++] = 0;
            }
            if (col == DATA.array_image_width) {
                array_image[row++] = v;
                v = [];
                col = 0;
            }
        }
        return array_image;
    }
    var process_metrix = function() {
        DATA.metrix_old = [];
        DATA.metrix_new = [];
        var line = 0;
        var py = get_projection_y();
        for (var i = 0; i < py.length; i+=2 ) {
            DATA.metrix_old[line] = [];
            DATA.metrix_new[line] = [];
            var py0 = py[i];
            var py1 = py[i+1] + 1;
            var px = get_projection_x( py0, py1 );
            for (var j = 0; j < px.length; j+=2 ) {
                var px0 = px[j];
                var px1 = px[j+1] + 1;
                var metrix_old = get_metrix_old(py0, py1, px0, px1);
                var metrix_new = get_metrix_new(metrix_old);
                DATA.metrix_old[line].push( metrix_old );
                DATA.metrix_new[line].push( metrix_new );
            }
            line++;
        }
    }
    var get_projection_y = function() {
        var py = [];
        for (var i = 0; i < DATA.array_image_height; i++ ) {
            for (var j = 0; j < DATA.array_image_width; j++ ) {
                if( !py[i] ) py[i] = 0;
                py[i] += DATA.array_image[i][j];
            }
        }
        return get_projection_id(py);
    }
    var get_projection_x = function(py0, py1) {
        var px = [];
        for (var i = py0; i < py1; i++ ) {
            for (var j = 0; j < DATA.array_image_width; j++ ) {
                if( !px[j] ) px[j] = 0;
                px[j] += DATA.array_image[i][j];
            }
        }
        return get_projection_id(px);
    }
    var get_projection_id = function( p ) {
        var id = [];
        var old = 0;
        for( var i = 0; i < p.length ; i++ ) {
            var curr = p[i];
            if( curr != 0 && old == 0 ) {
                id.push(i);
            }
            if( curr == 0 && old != 0 ) {
                id.push(i-1);
            }
            old = curr;
        }
        if( id.length%2!=0 ) id.push( p.length-1 );
        return id;
    }
    var get_metrix_old = function(py0, py1, px0, px1) {
        var char = [];
        var r=0, c=0;
        for (var i = py0; i < py1; i++ ) {
            char[r] = [];
            for (var j = px0; j < px1; j++ ) {
                char[r][c] = DATA.array_image[i][j];
                c++;
            }
            r++;
            c=0;
        }
        return char;
    }
    var get_metrix_new = function(metrix_old) {
        var h = metrix_old.length;
        var w = metrix_old[0].length;
        var metrix = [];
        for( var i = 0; i < DATA.weight_height; i++ ) {
            metrix[i] = [];
            var id_h = Math.floor( i*h/DATA.weight_height );
            for( var j = 0; j < DATA.weight_width; j++ ) {
                var id_w = Math.floor( j*w/DATA.weight_width );
                var v = metrix_old[id_h][id_w];
                metrix[i][j] = v;
            }
        }
        return metrix;
    }
    var test_weight = function(metrix) {
        var char = '?';
        var q_max = 0;
        Object.keys( DATA.weight ).map(function(objectKey, index) {
            var weight = DATA.weight[objectKey];
            var candidate = 0;
            var ideal = 0;
            for (var i = 0; i < DATA.weight_height; i++) {
                for (var j = 0; j < DATA.weight_width; j++) {
                    candidate += weight[i][j] * metrix[i][j];
                    if (weight[i][j] > 0) {
                        ideal += weight[i][j];
                    }
                }
            }
            var q = candidate / ideal;
            if (q > q_max) {
                q_max = q;
                char = String.fromCharCode(objectKey);
            }
        });
        return char;
    }
    var train_weight = function(metrix, char) {
        var char = char.charCodeAt(0);
        var weight;
        var metrix_m = get_metrix_m(metrix);
        if( DATA.weight[char] ) {
            weight = DATA.weight[char];
            for (var i = 0; i < DATA.weight_height; i++) {
                for (var j = 0; j < DATA.weight_width; j++) {
                    weight[i][j] += metrix_m[i][j];
                }
            }
        } else {
            weight = metrix_m;
        }
        DATA.weight[char] = weight;
        save_weight();
    }
    var get_metrix_m = function(metrix) {
        var m = [];
        for (var i = 0; i < DATA.weight_height; i++) {
            m[i] = [];
            for (var j = 0; j < DATA.weight_width; j++) {
                m[i][j] = ( metrix[i][j] == 0 ) ? -1 : 1;
            }
        }
        return m;
    }
    load_weight();
}