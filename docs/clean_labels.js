const fs = require('fs');
const path = require('path');
function standardizeLabelsExtended(dir) {
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) standardizeLabelsExtended(full);
        else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
            let c = fs.readFileSync(full, 'utf8');
            let orig = c;

            // Standardize Modals & Buttons with whitespace matching
            c = c.replace(/>\s*Emin misiniz\?\s*</g, '>İşlemi Onayla<');
            c = c.replace(/>\s*Vazgeç\s*</g, '>İptal<');
            c = c.replace(/>\s*Evet, Sil\s*</g, '>Kalıcı Olarak Sil<');

            // Confirm prompts
            c = c.replace(/confirm\(['"](.*?)emin misiniz\?['"]\)/gi, 'confirm("Bu işlemi onaylıyor musunuz?")');

            // "Emin misiniz?" texts 
            c = c.replace(/>\s*Bu (.*?) silmek istediğinizden emin misiniz\?(.*?)</gi, '>Bu öğeyi kalıcı olarak silmek istediğinizden emin misiniz?$2<');

            // Fix admin cards classes
            // Ensure shadow-sm everywhere, remove massive drop shadows
            c = c.replace(/shadow-xl/g, 'shadow-md');
            c = c.replace(/shadow-2xl/g, 'shadow-md');
            c = c.replace(/shadow-lg/g, 'shadow-md');

            if (orig !== c) {
                fs.writeFileSync(full, c, 'utf8');
                console.log('Standardized more labels in:', full);
            }
        }
    }
}
standardizeLabelsExtended('./app/(admin)/admin');
standardizeLabelsExtended('./components/admin');
