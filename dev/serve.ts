import clipboard from "clipboardy";
import QRCode from "qrcode";

const server = Bun.serve({
	port: 0,
	async fetch(req) {
		const url = new URL(req.url);
		let filePath = url.pathname;

		if (filePath === "/") {
			filePath = "/index.html";
		}

		const file = Bun.file(`./public${filePath}`);

		const existe = await file.exists();
		if (!existe) {
			return new Response("Arquivo não encontrado (404)", { status: 404 });
		}

		return new Response(file);
	},
});

const urlLocal = `http://localhost:${server.port}`;
console.log(`Servidor Local ativo em: ${urlLocal}`);

console.log("Criando túnel público para acesso de fora da rede...");
let urlPublica = urlLocal;

try {
	const proc = Bun.spawn(
		[
			"bunx",
			"@desplega.ai/localtunnel",
			"--port",
			server.port?.toString() as string,
		],
		{
			stdout: "pipe",
		},
	);

	const reader = proc.stdout.getReader();
	const { value } = await reader.read();
	const saidaTexto = new TextDecoder().decode(value).trim();

	const match = saidaTexto.match(/https:\/\/[^\s]+/);
	if (match) {
		urlPublica = match[0];
		console.log(`LINK PÚBLICO GERADO: ${urlPublica}`);
	}
} catch (tunnelError) {
	console.log("⚠️ Não foi possível abrir o túnel. Usando link local.");
}

try {
	await clipboard.write(urlPublica);
	console.log("Link público copiado para a área de transferência!");
} catch (err) {
	console.log("Não foi possível copiar para a área de transferência.");
}

try {
	const qrTerminal = await QRCode.toString(urlPublica, {
		type: "terminal",
		small: true,
	});
	console.log("\nEscaneie o QR Code abaixo no celular:");
	console.log(qrTerminal);
	Bun.spawn(["mkdir", "tmpassets"]);
	await QRCode.toFile("./tmpassets/qrcode.png", urlPublica);
} catch (err) {
	console.log("Erro ao gerar o QR Code:", err);
}
