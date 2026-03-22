import { Lucid, Blockfrost, Data } from "lucid-cardano";
import blueprint from "../assets/plutus.json"; 

// Definimos el Datum exacto que pusimos en Aiken
const PegDatum = Data.Object({
  owner: Data.Bytes,
  lock_until: Data.Integer,
});

export const createLockTx = async (amountADA) => {
  // 1. Iniciamos Lucid con tu API de Blockfrost
  const lucid = await Lucid.new(
    new Blockfrost("https://cardano-preprod.blockfrost.io/api/v0", "TU_PROJECT_ID"),
    "Preprod"
  );

  // 2. Conectamos la Wallet (Nami)
  const api = await window.cardano.nami.enable();
  lucid.selectWallet(api);

  // 3. Obtenemos el validador del JSON
  const validator = blueprint.validators.find(v => v.title === "peg_defense.spend");
  const scriptAddress = lucid.utils.validatorToAddress(validator);

  // 4. Preparamos el Datum (Dueño + 30 segundos)
  const ownerPkh = lucid.utils.getAddressDetails(await lucid.wallet.address()).paymentCredential.hash;
  const lockUntil = BigInt(Date.now() + 30000); // Tiempo actual + 30s

  const datum = Data.to({
    owner: ownerPkh,
    lock_until: lockUntil,
  }, PegDatum);

  // 5. Construimos la Transacción
  const tx = await lucid
    .newTx()
    .payToContract(scriptAddress, { inline: datum }, { lovelace: BigInt(amountADA * 1000000) })
    .complete();

  const signedTx = await tx.sign().complete();
  return await signedTx.submit();
};