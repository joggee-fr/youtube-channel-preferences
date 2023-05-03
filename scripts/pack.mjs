import { createWriteStream, readdirSync, createReadStream } from "fs";
import archiver from "archiver";

const builddir = "dist";
let output = createWriteStream(builddir + '/youtube-channel-preferences.zip');
let archive = archiver('zip');

archive.on('error', err => { throw err });
archive.pipe(output);

let files = readdirSync(builddir);

for (const file of files) {
    archive.append(createReadStream(`${builddir}/${file}`), { name: file });
}

archive.finalize();
