import { WorkSession } from "../entities/workSession.js";
import { Car } from "../entities/car.js";

export default function workSessionService() {
  async function start(req, carId, operatorName) {
    if(!req.user || !carId || !operatorName) {
      throw new Error('User not logged in or invalid parameters');
    }
    
    // Check if there is already an active session for this operator and car
    const activeSession = await WorkSession.findOne({
      where: {
        carId,
        operatorName,
        endTime: null
      }
    });

    if (activeSession) return activeSession;

    return await WorkSession.create({
      carId,
      operatorName,
      startTime: new Date()
    });
  }

  async function stop(req, carId, operatorName) {
    if(!req.user || !carId || !operatorName) {
      throw new Error('User not logged in or invalid parameters');
    }
    
    const activeSession = await WorkSession.findOne({
      where: {
        carId,
        operatorName,
        endTime: null
      }
    });
    console.log(activeSession);
    if (!activeSession) return null;

    const endTime = new Date();
    const startTime = new Date(activeSession.startTime);
    const durationMs = endTime - startTime;
    const durationMinutes = Math.floor(durationMs / 60000);
    console.log(endTime)
    await activeSession.update({
      endTime,
      durationMinutes
    });

    // Update the totalHours on the Car
    const allSessions = await WorkSession.findAll({ where: { carId } });
    const totalMins = allSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    const totalHoursStr = `${h}h ${m}m`;
    console.log(totalHoursStr)
    await Car.update({ totalHours: totalHoursStr }, { where: { id: carId } });

    return activeSession;
  }

  async function getActive(req, carId) {
    if(!req.user || !carId) {
      throw new Error('User not logged in or invalid carId');
    }
    
    return await WorkSession.findAll({
      where: {
        carId,
        endTime: null
      }
    });
  }

  async function getByCar(req, carId) {
    if(!req.user || !carId) {
      throw new Error('User not logged in or invalid carId');
    }
    
    return await WorkSession.findAll({
      where: {
        carId
      },
      order: [['startTime', 'DESC']]
    });
  }

  return {
    start,
    stop,
    getActive,
    getByCar
  };
}
