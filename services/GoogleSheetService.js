const axios = require('axios');

exports.getContacts = async () => {
    try {
        const response = await axios.get(process.env.CONTACTS_URL);
        
        // Cek jika data yang diterima adalah array atau objek yang mengandung daftar kontak
        if (Array.isArray(response.data)) {
            return response.data; // Return daftar nomor telepon dalam bentuk array
        } else if (response.data && response.data.contacts && Array.isArray(response.data.contacts)) {
            // Jika kontak ada dalam objek dengan properti 'contacts'
            return response.data.contacts;
        } else {
            // Jika data tidak sesuai format yang diharapkan
            throw new Error('Data kontak tidak dalam format yang diharapkan (array atau objek dengan properti "contacts").');
        }
    } catch (error) {
        console.error('Gagal mengambil kontak:', error.message);
        throw error;
    }
};

exports.getMessageAndMedia = async () => {
    try {
        const response = await axios.get(process.env.MESSAGE_URL);

        // Pastikan response.data memiliki properti message dan mediaUrl
        const { message, mediaUrl } = response.data;

        if (!message) {
            throw new Error('Pesan tidak ditemukan dalam data.');
        }

        // Jika mediaUrl ada, pastikan itu adalah URL yang valid
        if (mediaUrl && typeof mediaUrl !== 'string') {
            throw new Error('URL media tidak valid.');
        }

        return { message, mediaUrl };
    } catch (error) {
        console.error('Gagal mengambil pesan dan media:', error.message);
        throw error;
    }
};
