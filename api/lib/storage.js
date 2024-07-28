const fs = require("fs");
// const sharp = require("sharp");

const storeImage = async (buffer, dir, name = null, thumb = true) => {
  dir = `uploads/${dir}`;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    let attachmentPath = path.join(dir, name);
    if (thumb) {
      let thumbPath = path.join(dir, "thumb");
      let thumbAttac = path.join(thumbPath, name);

      if (!fs.existsSync(thumbPath)) {
        fs.mkdirSync(thumbPath, { recursive: true });
      }
      // Jika Anda ingin menggunakan sharp untuk resize gambar
      // let buffer = Buffer.from(base64String, 'base64');
      // await sharp(buffer).resize(100).toFile(thumbAttac);
    }
    // let buffer = Buffer.from(base64String, 'base64');
    fs.writeFileSync(attachmentPath, buffer);
    return true;
  } catch (err) {
    console.log(err);
    throw new Error(err);
  }
};

const storeFile = async (file, dir, name = null) => {
  dir = `uploads/${dir}`;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    let attachmentPath = `./${dir}/${name}`;
    fs.writeFileSync(attachmentPath, file);
    return true;
  } catch (err) {
    console.log(err);
    throw new Error(err);
  }
};

const removeFile = async (dir, filename) => {
  console.log(filename);
  var path = `uploads/${filename}`;
  var path_thumb = `uploads/thumb/${filename}`;
  try {
    if (fs.existsSync(path)) {
      await fs.unlinkSync(path);
    }

    if (fs.existsSync(path_thumb)) {
      await fs.unlinkSync(path_thumb);
    }
  } catch (err) {
    throw err;
  }
};

module.exports = {
  storeImage,
  storeFile,
  removeFile,
};
