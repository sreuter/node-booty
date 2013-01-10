var knox = require('knox'),
    crypto = require('crypto'),
    fs = require('fs');

var Booty = module.exports = function(options) {

  this.client = knox.createClient({
    key: options.key,
    secret: options.secret,
    bucket: options.bucket
  });

};

Booty.prototype.getConfig = function(id,dest,key,cb) {
  this.client.getFile('/' + id + '.json.enc', function(err, res){
    if(err || res.statusCode !== 200) {
      cb(err || new Error("Not status code 200"));
    } else {
      var config_file = fs.createWriteStream(dest);
      var decipher = crypto.createDecipher('aes-256-cfb', key);
      config_file.on('close', function() {
        cb();
      });
      res.on('data', function(data) {
        config_file.write(decipher.update(data));
      });
      res.on('end', function() {
        config_file.write(decipher.final());
        config_file.end();
      });
    }
  });
};

Booty.prototype.putConfig = function(id,src,key,cb) {
  var config_file = fs.createReadStream(src);
  var fstat = fs.statSync(src);
  var cipher = crypto.createCipher('aes-256-cfb', key);
  var headers = {
    'Content-Length': fstat.size
  };

  var req = this.client.put('/' + id + '.json.enc', headers);

  req.on('response', function(res) {
    if(res.statusCode !== 200) {
      cb(err || new Error("Not status code 200"));
    } else {
      cb();
    }
  });

  config_file.on('data', function(data) {
    req.write(cipher.update(data), 'binary');
  });

  config_file.on('end', function() {
    req.end();
  });
};

