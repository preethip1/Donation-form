import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
var firebaseConfig = {
    apiKey: "AIzaSyCV77CSMCAQs1XNqGdkDZKX8k8rzHKmPg4",
    authDomain: "donation-form-a40c5.firebaseapp.com",
    databaseURL: "https://donation-form-a40c5.firebaseio.com",
    projectId: "donation-form-a40c5",
    storageBucket: "donation-form-a40c5.appspot.com",
    messagingSenderId: "119421913118",
    appId: "1:119421913118:web:f46f68525160edc6af060f",
    measurementId: "G-YLLDGCNLG1"
};

firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();
export const googleProvider = new firebase.auth.GoogleAuthProvider();

export const db = firebase.firestore();