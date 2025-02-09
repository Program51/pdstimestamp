import { useState, useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { Button } from "/src/components/ui/button";
import { Card, CardContent } from "/src/components/ui/card";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "/src/firebase"; // นำเข้า Firebase ที่ถูกต้อง



const SCHOOL_LOCATION = { lat: 13.736717, lng: 100.523186 }; // ตำแหน่งโรงเรียน (ตัวอย่าง)
const RADIUS = 100; // รัศมีในเมตรที่อนุญาตให้เช็กชื่อ

export default function AttendanceTracker() {
  const [position, setPosition] = useState(null);
  const [status, setStatus] = useState("กำลังตรวจสอบตำแหน่ง...");
  const [attendanceRecorded, setAttendanceRecorded] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          checkProximity(pos.coords.latitude, pos.coords.longitude);
        },
        () => setStatus("ไม่สามารถเข้าถึงตำแหน่งของคุณได้")
      );
    } else {
      setStatus("เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง");
    }
  }, [user]);

  function checkProximity(lat, lng) {
    const distance = getDistance(lat, lng, SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng);
    if (distance <= RADIUS) {
      setStatus("อยู่ในบริเวณโรงเรียน สามารถเช็กชื่อได้");
      if (user) recordAttendance();
    } else {
      setStatus("คุณอยู่นอกบริเวณโรงเรียน ไม่สามารถเช็กชื่อได้");
    }
  }

  async function recordAttendance() {
    try {
      await addDoc(collection(db, "attendance"), {
        timestamp: new Date().toISOString(),
        position,
        user: user?.displayName || "ไม่ระบุชื่อ",
        userId: user?.uid,
      });
      setAttendanceRecorded(true);
    } catch (error) {
      console.error("Error recording attendance: ", error);
    }
  }

  function signIn() {
    signInWithPopup(auth, provider).then((result) => {
      setUser(result.user);
    });
  }

  function logOut() {
    signOut(auth).then(() => {
      setUser(null);
    });
  }

  function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function toRad(value) {
    return (value * Math.PI) / 180;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md p-4 text-center">
        <CardContent>
          <h2 className="text-xl font-bold">บันทึกการมาโรงเรียน</h2>
          {user ? (
            <>
              <p className="mt-2">สวัสดี, {user.displayName}</p>
              <p className="mt-2">{status}</p>
              {attendanceRecorded && <p className="text-green-500">บันทึกข้อมูลเรียบร้อยแล้ว</p>}
              <Button className="mt-4" onClick={logOut}>ออกจากระบบ</Button>
            </>
          ) : (
            <Button className="mt-4" onClick={signIn}>เข้าสู่ระบบด้วย Google</Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
