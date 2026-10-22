import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { fileURLToPath } from "node:url";

const PROTO_PATH = fileURLToPath(new URL("./proto/api.proto", import.meta.url));

const definition = protoLoader.loadSync(PROTO_PATH, { keepCase: true });
const api = grpc.loadPackageDefinition(definition).api.unsafe.sensor_void_energy;

export function startSensorServer(port, getHexdata) {
    const server = new grpc.Server();

    server.addService(api.SensorVoidEnergyServer.service, {
        read_sensor_data: (call, callback) => {
            getHexdata()
                .then((hexdata) => callback(null, { hexdata }))
                .catch((error) => callback({
                    code: grpc.status.UNAVAILABLE,
                    message: error.message
                }));
        }
    });

    return new Promise((resolve, reject) => {
        server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (error) => {
            if (error) {
                reject(error);
                return;
            }
            console.log(`[grpc] Server hört auf Port ${port}`);
            resolve(server);
        });
    });
}

export function createSensorClient(address) {
    return new api.SensorVoidEnergyServer(address, grpc.credentials.createInsecure());
}
