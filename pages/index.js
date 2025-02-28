import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { auth, provider } from "/src/firebase";
import { signInWithPopup } from "firebase/auth";

const SCHOOL_LOCATION = { lat: 13.7428992, lng: 100.450304 };
const RADIUS = 100;
const db = getFirestore();

export default function AttendanceTracker() {
  const [position, setPosition] = useState(null);
  const [status, setStatus] = useState("⏳ กำลังตรวจสอบตำแหน่ง...");
  const [attendanceRecorded, setAttendanceRecorded] = useState(false);
  const [user, setUser] = useState(null);
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [summary, setSummary] = useState({ totalDays: 0, presentDays: 0, lateDays: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("th-TH"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition({ lat: latitude, lng: longitude });
          checkProximity(latitude, longitude);
        },
        () => setStatus("❌ ไม่สามารถเข้าถึงตำแหน่งของคุณได้"),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    } else {
      setStatus("❌ เบราว์เซอร์ของคุณไม่รองรับ GPS");
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAttendanceSummary(user.uid);
    }
  }, [user]);

  function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function checkProximity(lat, lng) {
    const distance = getDistance(lat, lng, SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng);
    if (distance <= RADIUS) {
      setStatus("✅ คุณอยู่ในบริเวณโรงเรียน");
      setCanCheckIn(true);
    } else {
      setStatus("❌ คุณอยู่นอกบริเวณโรงเรียน");
      setCanCheckIn(false);
    }
  }

  async function recordAttendance() {
    if (!user || attendanceRecorded || !canCheckIn) return;
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // ตรวจสอบว่าเคยเช็กอินวันนี้หรือยัง
    const attendanceRef = collection(db, "attendance");
    const q = query(attendanceRef, where("userId", "==", user.uid), where("date", "==", today));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      setStatus("✅ คุณได้เช็คอินไปแล้ววันนี้");
      return;
    }

    // เช็กอินหลัง 07:50 น. ถือว่า "มาสาย"
    const checkInTime = new Date();
    checkInTime.setHours(7, 50, 0, 0);
    const status = now > checkInTime ? "⏳ มาสาย" : "✔️ มาเรียน";

    await addDoc(attendanceRef, {
      userId: user.uid,
      timestamp: now.toISOString(),
      date: today,
      status
    });

    setAttendanceRecorded(true);
    setStatus(`✅ เช็คอินสำเร็จ (${status})`);
    fetchAttendanceSummary(user.uid);
  }

  async function fetchAttendanceSummary(uid) {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const q = query(collection(db, "attendance"),
    where("userId", "==", user.uid),
    orderBy("timestamp", "desc") 
 );


    const querySnapshot = await getDocs(q);
    
    let presentDays = new Set();
    let lateDays = new Set();

    querySnapshot.forEach(doc => {
      const date = doc.data().date;
      if (doc.data().status === "✔️ มาเรียน") presentDays.add(date);
      if (doc.data().status === "⏳ มาสาย") lateDays.add(date);
    });

    setSummary({
      totalDays: presentDays.size + lateDays.size,
      presentDays: presentDays.size,
      lateDays: lateDays.size
    });
  }

  function signInWithGoogle() {
    signInWithPopup(auth, provider)
      .then((result) => setUser(result.user))
      .catch((error) => console.error("Error during sign-in: ", error));
  }

  return (
    <motion.div 
      className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-purple-500 to-blue-600 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >  
      
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 text-center">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-4">📌 เช็กอินการมาเรียน</h2>
        {position && (
           
          <div className="mb-4 bg-gray-100 p-4 rounded-lg shadow-inner text-gray-800">
            <p className="text-md font-semibold">🌍 พิกัดของคุณ</p>
            <p className="text-sm">📍 ละติจูด: {position?.lat}</p>
            <p className="text-sm">📍 ลองจิจูด: {position?.lng}</p>
          </div>
        )}

        <p className="text-lg text-gray-700 font-semibold">⏰ {currentTime}</p>
        <p className="mt-2 text-md text-gray-700 font-medium">{status}</p>

        {user ? (
          <>
            {!attendanceRecorded && canCheckIn && (
              <button 
                className="mt-6 w-full bg-green-500 hover:bg-green-700 text-white font-bold py-3 rounded-full shadow-lg transition-all transform hover:scale-105"
                onClick={recordAttendance}
              >
                🕒 เช็กอิน
              </button>
            )}

            <div className="mt-6 bg-gray-100 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-bold text-gray-900">📊 สรุปการมาเรียนของนักเรียน</h3>
              <p className="text-md text-gray-700 mt-2">📅 มาเรียนทั้งหมด: {summary.totalDays} วัน</p>
              <p className="text-md text-gray-700 mt-1">⏳ มาสาย: {summary.lateDays} วัน</p>
            </div>
          </>
        ) : (
          <button 
            className="mt-6 w-full bg-blue-600 hover:bg-blue-800 text-white font-bold py-3 rounded-full shadow-lg transition-all transform hover:scale-105"
            onClick={signInWithGoogle}
          >
            🔑 เข้าสู่ระบบด้วย Google
          </button>
        )}
      </div>
    </motion.div>
  );
}
