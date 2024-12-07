import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../../../firebase/firebase";
import { Search, ChevronDown, ChevronUp, Calendar, Clock, MapPin } from "lucide-react";
import {
  getDoc,
  getDocs,
  doc,
  where,
  collection,
  query,
} from "firebase/firestore";

const UserInfo = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [carDetails, setCarDetails] = useState(null);
  const [currentResDetails, setCurrentResDetails] = useState([]);
  const [pastResDetails, setPastResDetails] = useState([]);
  const [archivedResDetails, setArchivedResDetails] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOption, setFilterOption] = useState("all");
  const [isArchiveExpanded, setIsArchiveExpanded] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  const fetchUserDetails = async () => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log("Current User:", user);

        // Get the user information
        const docRef = doc(db, "Users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserDetails(docSnap.data());
        } else {
          console.log("No such document!");
        }

        const userDocRef = doc(db, "Users", user.uid);

        //Get the Car details
        const docRef1 = collection(db, "Vehicles");
        const carInfo = query(docRef1, where("userRef", "==", userDocRef));
        const docSnap1 = await getDocs(carInfo);

        if (!docSnap1.empty) {
          const carData = docSnap1.docs[0].data();
          setCarDetails(carData);
        }

        //Showing the reservation of user
        const reservation = collection(db, "Reservations");
        const reservationSnap = query(
            reservation,
            where("userRef", "==", userDocRef)
        );
        const resSnap = await getDocs(reservationSnap);

        if (!resSnap.empty) {
          const allReservations = resSnap.docs.map((doc) => doc.data());

          // Separate current, past, and archived reservations
          const now = new Date();
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const current = [];
          const past = [];
          const archived = [];

          allReservations.forEach(reservation => {
            const endTime = new Date(reservation.reservationEndTime);
            if (endTime > now) {
              current.push(reservation);
            } else if (endTime > weekAgo) {
              past.push(reservation);
            } else {
              archived.push(reservation);
            }
          });

          // Sort all reservation arrays
          current.sort((a, b) => new Date(a.reservationStartTime) - new Date(b.reservationStartTime));
          past.sort((a, b) => new Date(b.reservationEndTime) - new Date(a.reservationEndTime));
          archived.sort((a, b) => new Date(b.reservationEndTime) - new Date(a.reservationEndTime));

          setCurrentResDetails(current);
          setPastResDetails(past);
          setArchivedResDetails(archived);
        }
      } else {
        console.log("No user signed in!");
        window.location.replace("/");
      }
    });
  };

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const filterReservations = (reservations) => {
    return reservations.filter(reservation => {
      const searchFields = [
        reservation.parkingLot,
        reservation.slotID,
        formatDate(reservation.reservationStartTime),
        formatDate(reservation.reservationEndTime)
      ].map(field => field.toLowerCase());

      return searchFields.some(field => field.includes(searchTerm.toLowerCase()));
    });
  };

  return (
      <div className="container jumbotron-fluid py-2">
        <h1 className="text-md-left font-weight-bold my-5">
          Welcome, {userDetails?.firstName}!
        </h1>
        <div className="container">
          {/* User Info Box */}
          <div className="container box text-white">
            <p>
              <i className="bi bi-person-circle me-2"></i>
              Surname: {userDetails?.lastName}
            </p>
            <p>
              <i className="bi bi-envelope me-2"></i>
              Your email: {userDetails?.email}
            </p>
            <p className="font-weight-bold">
              <i className="bi bi-car-front me-2"></i>
              Your Vehicle:
            </p>
            <p className="ms-4">Make: {carDetails?.carMake || "Not specified"}</p>
            <p className="ms-4">Model: {carDetails?.carModel || "Not specified"}</p>
            <p className="ms-4">Year: {carDetails?.carYear || "Not specified"}</p>
          </div>

          {/* Reservation Button */}
          <div className="text-center">
            <Link to={"/dashboard/time"}>
              <button className="btn btn-primary btn-lg my-4">
                <i className="bi bi-car-front me-2"></i>
                Make a Reservation
              </button>
            </Link>
          </div>

          {/* Reservations Section */}
          <div className="container p-4" style={{backgroundColor: '#1B2641', borderRadius: '12px'}}>
            {/* Search and Filter */}
            <div className="d-flex align-items-center gap-3 pb-4" style={{ backgroundColor: '#1B2641', padding: '20px' }}>
              <i className="bi bi-search"
                 style={{
                   color: '#6B7280',
                   fontSize: '20px',
                   marginRight: '-40px',
                   zIndex: '1'
                 }}
              ></i>
              <input
                  type="text"
                  placeholder="Search reservations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    flex: '1',
                    minWidth: '150px',
                    padding: '12px 20px 12px 50px',
                    fontSize: '16px',
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#6B7280'
                  }}
              />
              <select
                  value={filterOption}
                  onChange={(e) => setFilterOption(e.target.value)}
                  style={{
                    maxWidth: '200px',
                    padding: '12px 40px 12px 20px',
                    fontSize: '16px',
                    backgroundColor: 'rgba(44, 52, 68, 0.8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 15px center',
                    backgroundSize: '16px'
                  }}
              >
                <option value="all">All Reservations</option>
                <option value="current">Current Only</option>
                <option value="past">Past Only</option>
              </select>
            </div>

            {/* Reservations Title */}
            <div className="d-flex align-items-center mb-4">
              <i className="bi bi-calendar-check me-2 text-white"></i>
              <h2 className="text-white m-0">Your Reservations</h2>
            </div>

            {/* Current Reservations */}
            {filterOption !== 'past' && (
                <div className="mb-4">
                  <h3 className="text-white mb-3">Current & Upcoming Reservations:</h3>
                  {currentResDetails.length > 0 ? (
                      currentResDetails.map((reservation, index) => (
                          <div key={index}
                               className="mb-3 p-4"
                               style={{backgroundColor: '#0077FF', borderRadius: '8px', color: 'white'}}>
                            <h4>Reservation {index + 1}</h4>
                            <div className="row g-3">
                              <div className="col-md-6">
                                <i className="bi bi-clock me-2"></i>
                                Start: {formatDate(reservation.reservationStartTime)}
                              </div>
                              <div className="col-md-6">
                                <i className="bi bi-clock-fill me-2"></i>
                                End: {formatDate(reservation.reservationEndTime)}
                              </div>
                              <div className="col-md-6">
                                <i className="bi bi-geo-alt me-2"></i>
                                Location: {reservation.parkingLot || "Not specified"}
                              </div>
                              <div className="col-md-6">
                                <i className="bi bi-p-square me-2"></i>
                                Slot: {reservation.slotID || "Not specified"}
                              </div>
                            </div>
                          </div>
                      ))
                  ) : (
                      <p className="text-white-50">No current reservations found.</p>
                  )}
                </div>
            )}

            {/* Past Reservations */}
            {filterOption !== 'current' && (
                <div className="mb-4">
                  <h3 className="text-white mb-3">Past Reservations:</h3>
                  {pastResDetails.length > 0 ? (
                      pastResDetails.map((reservation, index) => (
                          <div key={index}
                               className="mb-3 p-4"
                               style={{backgroundColor: '#4a5568', borderRadius: '8px', color: 'white'}}>
                            <h4>Reservation {index + 1}</h4>
                            <div className="row g-3">
                              <div className="col-md-6">
                                <i className="bi bi-clock me-2"></i>
                                Start: {formatDate(reservation.reservationStartTime)}
                              </div>
                              <div className="col-md-6">
                                <i className="bi bi-clock-fill me-2"></i>
                                End: {formatDate(reservation.reservationEndTime)}
                              </div>
                              <div className="col-md-6">
                                <i className="bi bi-geo-alt me-2"></i>
                                Location: {reservation.parkingLot || "Not specified"}
                              </div>
                              <div className="col-md-6">
                                <i className="bi bi-p-square me-2"></i>
                                Slot: {reservation.slotID || "Not specified"}
                              </div>
                            </div>
                          </div>
                      ))
                  ) : (
                      <p className="text-white-50">No past reservations found.</p>
                  )}
                </div>
            )}

            {/* Archived Reservations */}
            {filterOption !== 'current' && (
                <div className="mt-4">
                  <button
                      onClick={() => setIsArchiveExpanded(!isArchiveExpanded)}
                      className="w-100 d-flex justify-content-between align-items-center p-3"
                      style={{
                        backgroundColor: '#2d3748',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                  >
                    <span className="fw-bold">Archived Reservations (Older than 1 week)</span>
                    <i className={`bi bi-chevron-${isArchiveExpanded ? 'up' : 'down'}`}></i>
                  </button>

                  {isArchiveExpanded && (
                      <div className="mt-3">
                        {archivedResDetails.length > 0 ? (
                            archivedResDetails.map((reservation, index) => (
                                <div key={index}
                                     className="mb-3 p-4"
                                     style={{backgroundColor: '#2d3748', borderRadius: '8px', color: 'white'}}>
                                  <h4>Reservation {index + 1}</h4>
                                  <div className="row g-3">
                                    <div className="col-md-6">
                                      <i className="bi bi-clock me-2"></i>
                                      Start: {formatDate(reservation.reservationStartTime)}
                                    </div>
                                    <div className="col-md-6">
                                      <i className="bi bi-clock-fill me-2"></i>
                                      End: {formatDate(reservation.reservationEndTime)}
                                    </div>
                                    <div className="col-md-6">
                                      <i className="bi bi-geo-alt me-2"></i>
                                      Location: {reservation.parkingLot || "Not specified"}
                                    </div>
                                    <div className="col-md-6">
                                      <i className="bi bi-p-square me-2"></i>
                                      Slot: {reservation.slotID || "Not specified"}
                                    </div>
                                  </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-white-50 mt-3">No archived reservations found.</p>
                        )}
                      </div>
                  )}
                </div>
            )}
          </div>
        </div>
      </div>
  );
}

export default UserInfo;