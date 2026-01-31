import { Car } from "../entities/car.js";

const toApiModel = (car) => ({
    id: car.id,
    name: car.model + " " + car.plate,
    model: car.model,
    plate: car.plate,
    status: car.status,
    lavorazioni: car.lavorazioni,
    note: car.note,
    partialHours: car.partialHours,
    totalHours: car.totalHours,
    photo: car.photo
});

export default function carService() {
    async function getAll(req) {
        if(!req.user) throw new Error('User not logged in');
        const DbCars = await Car.findAll();
        return DbCars.map(toApiModel);
    }

    async function getById(req, id) {
        if(!req.user || !id) throw new Error('User not logged in or invalid id');
        const DbCar = await Car.findByPk(id);
        return toApiModel(DbCar);
    }

    async function create(req, data) {
        if(!req.user) throw new Error('User not logged in');
        return toApiModel(await Car.create(data));
    }

    async function update(req, id, data) {
        if(!req.user || !id) throw new Error('User not logged in or invalid id');
        const car = await Car.findByPk(id);
        if (!car) throw new Error('car not found');
        return await car.update(data);
    }
 
    async function remove(req, id) {
        if(!req.user || !id) throw new Error('User not logged in or invalid id');
        const car = await Car.findByPk(id);
        if (!car) throw new Error('car not found');
        return toApiModel(await car.destroy());
    }
    return {
        getAll,
        getById,
        create,
        update,
        remove
    };
}