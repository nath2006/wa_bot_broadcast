const { Controller, Response } = require("pepesan");
const f = require("../utils/Formatter");
const DataModel = require('../models/DataModel'); // Pastikan ini sesuai dengan lokasi model Anda

module.exports = class BotController extends Controller {

    // Menampilkan menu pengantar
    async introduction(request) {
        return Response.menu.fromArrayOfString(
            [f("menu.broadcastSend")],
            f("intro", [request.name]),
            f("template.menu")
        );
    }

    async sendBroadcast(bot) {
        try {
            // Ambil data kontak dan pesan
            const contacts = await DataModel.fetchContacts(); // Pastikan array kontak terisi dengan benar
            const { message, mediaPath } = await DataModel.fetchMessageAndMedia();
            const batchSize = 200; // Ukuran batch per pengiriman
            const delay = parseInt(process.env.MESSAGE_DELAY, 10) || 10000; // Delay antar batch, bisa disesuaikan
    
            // Proses kontak dalam batch
            for (let i = 0; i < contacts.length; i += batchSize) {
                const batch = contacts.slice(i, i + batchSize);  // Ambil batch kontak berikutnya
                const responseArray = [message];  // Teks pesan
    
                if (mediaPath) {
                    responseArray.push(Response.image.fromURL(mediaPath, ""));
                }
    
                // Kirim pesan ke setiap kontak dalam batch secara berurutan
                for (const contact of batch) {
                    const recipient = `${contact}`; // Format nomor WhatsApp
                    console.log(`Mengirim pesan ke: ${recipient}`); // Debugging log
    
                    try {
                        // Kirim pesan dengan retry logic
                        await this.sendWithRetry(recipient, responseArray); 
                        console.log(`Pesan terkirim ke: ${contact}`);
                    } catch (error) {
                        console.error(`Gagal mengirim pesan ke ${contact}: ${error.message}`);
                    }
                }
    
                // Jeda setelah mengirim batch
                if (i + batchSize < contacts.length) {
                    console.log(`Menunggu ${delay / 1000} detik sebelum batch berikutnya...`);
                    await new Promise((resolve) => setTimeout(resolve, delay)); // Tunggu sebelum batch berikutnya
                }
            }
    
            console.log('Broadcast selesai.');
        } catch (error) {
            console.error('Gagal mengirim broadcast:', error);
        }
    }
    
    async sendWithRetry(number, responseArray, retries = 3, delay = 5000) {
        try {
            await this.send(number, responseArray);  // Coba kirim pesan
        } catch (error) {
            if (retries > 0) {
                console.log(`Gagal mengirim ke ${number}. Mencoba lagi... (${retries} percobaan tersisa)`);
                await new Promise((resolve) => setTimeout(resolve, delay)); // Tunggu sebelum retry
                return this.sendWithRetry(number, responseArray, retries - 1, delay);  // Coba lagi
            } else {
                throw new Error(`Gagal mengirim pesan ke ${number} setelah ${retries} percobaan.`);
            }
        }
    }
    

}
