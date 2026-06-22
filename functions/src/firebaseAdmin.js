// functions/src/firebaseAdmin.js

const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {getFirestore} = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();
const auth = getAuth();

module.exports = {
  db,
  auth,
};
