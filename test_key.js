
function calculateKey(machineId, tenantId) {
    const salt = "NEBRAS_SECRET_SALT_2026";
    let hash = 0;
    const str = machineId + tenantId + salt;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return "NBR-" + Math.abs(hash).toString(16).toUpperCase();
}

const machineId = "7DAFA49E326BCCEE";
console.log("For default_user:", calculateKey(machineId, "default_user"));
console.log("For authentic:", calculateKey(machineId, "authentic"));
console.log("For empty tenant:", calculateKey(machineId, ""));
