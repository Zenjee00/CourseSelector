import '../FrontendCSS/Results.css';

import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  deleteUserProgram,
  getUserSavedPrograms,
} from '../BackendFbase/courseRecommendations';
import { auth } from '../BackendFbase/Firebase';
import { universities } from '../data/universities';
import {
  geocodeViaProxy,
  getRoadDistanceViaProxy,
  getUserLocation,
  sortUniversitiesByDistance,
} from '../utils/location';

const GEO_CACHE_KEY = 'course_selector_geocode_cache_v1';
const ROUTE_CACHE_KEY = 'course_selector_route_cache_v1';

const readGeocodeCache = () => {
        try {
                const raw = localStorage.getItem(GEO_CACHE_KEY);
                return raw ? JSON.parse(raw) : {};
        } catch {
                return {};
        }
};

const getSchoolKey = (school) => `${school.name}||${school.location}`.toLowerCase();
const readRouteCache = () => {
    try {
        const raw = localStorage.getItem(ROUTE_CACHE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

const getOriginKey = (coords) => {
    if (!coords) return 'no-origin';
    const lat = Number(coords.latitude ?? coords.lat ?? 0).toFixed(4);
    const lon = Number(coords.longitude ?? coords.lng ?? coords.lon ?? 0).toFixed(4);
    return `${lat},${lon}`;
};

const getRouteKey = (originKey, school) => `${originKey}=>${getSchoolKey(school)}`;

function Results() {
    const navigate = useNavigate();
    const [savedPrograms, setSavedPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [geocodeCache, setGeocodeCache] = useState(() => readGeocodeCache());
    const [routeCache, setRouteCache] = useState(() => readRouteCache());
    const [geocodingProgress, setGeocodingProgress] = useState({ running: false, done: 0, total: 0 });
    const [routeProgress, setRouteProgress] = useState({ running: false, done: 0, total: 0 });
    const [geocodingMessage, setGeocodingMessage] = useState('');
    const geocodeMsgTimer = useRef(null);

    const originKey = getOriginKey(userLocation);

    useEffect(() => {
        localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(geocodeCache));
    }, [geocodeCache]);

    useEffect(() => {
        localStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify(routeCache));
    }, [routeCache]);

    const getUniversitiesForProgram = (programName) => {
        if (!programName) return [];
        const schools = universities
            .filter((university) => university.programs.includes(programName))
            .map((school) => {
                const cacheKey = getSchoolKey(school);
                const cachedCoords = geocodeCache[cacheKey];
                const routeKey = getRouteKey(originKey, school);
                const cachedRoute = routeCache[routeKey];
                return {
                    ...school,
                    lat: school.lat ?? cachedCoords?.lat ?? null,
                    lon: school.lon ?? cachedCoords?.lon ?? null,
                    routeDistanceKm: cachedRoute?.distanceKm ?? null,
                    routeDurationMin: cachedRoute?.durationMin ?? null,
                };
            });

        if (userLocation) {
            return sortUniversitiesByDistance(schools, userLocation).sort((a, b) => {
                const aValue = a.routeDistanceKm ?? a.distance;
                const bValue = b.routeDistanceKm ?? b.distance;
                if (aValue == null && bValue == null) return 0;
                if (aValue == null) return 1;
                if (bValue == null) return -1;
                return aValue - bValue;
            });
        }
        return schools;
    };

    useEffect(() => {
        const fetchResults = async () => {
            if (!auth.currentUser) {
                navigate('/login');
                return;
            }
            try {
                const programs = await getUserSavedPrograms(auth.currentUser.uid);
                setSavedPrograms(programs.sort((a, b) => b.timestamp - a.timestamp));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
        // try to get user location (will prompt user for permission)
        getUserLocation()
            .then((coords) => setUserLocation(coords))
            .catch((err) => setLocationError(err.message || 'Could not get location'));
    }, [navigate]);

    useEffect(() => {
        if (!savedPrograms.length) return;

        const allProgramNames = new Set();
        savedPrograms.forEach((entry) => {
            (entry.recommendedPrograms || []).forEach((name) => allProgramNames.add(name));
        });

        const schoolsToCheck = universities.filter((school) =>
            school.programs?.some((programName) => allProgramNames.has(programName))
        );

        const missingCoordsSchools = schoolsToCheck.filter((school) => {
            if (school.lat && school.lon) return false;
            const cacheKey = getSchoolKey(school);
            return !geocodeCache[cacheKey];
        });

        if (!missingCoordsSchools.length) return;

        let cancelled = false;

        const runGeocode = async () => {
            setGeocodingProgress({ running: true, done: 0, total: missingCoordsSchools.length });
            setGeocodingMessage('Calculating nearest schools...');

            const updates = {};
            for (let i = 0; i < missingCoordsSchools.length; i += 1) {
                if (cancelled) return;

                const school = missingCoordsSchools[i];
                const cacheKey = getSchoolKey(school);
                const query = `${school.name}, ${school.location}, Philippines`;
                const geocoded = await geocodeViaProxy(query);

                if (geocoded?.lat && geocoded?.lon) {
                    updates[cacheKey] = { lat: geocoded.lat, lon: geocoded.lon, updatedAt: Date.now() };
                }

                setGeocodingProgress({ running: true, done: i + 1, total: missingCoordsSchools.length });
            }

            if (!cancelled && Object.keys(updates).length) {
                setGeocodeCache((prev) => ({ ...prev, ...updates }));
            }

            if (!cancelled) {
                setGeocodingProgress((prev) => ({ ...prev, running: false }));
                setGeocodingMessage('Nearest schools are updated.');
                if (geocodeMsgTimer.current) clearTimeout(geocodeMsgTimer.current);
                geocodeMsgTimer.current = setTimeout(() => setGeocodingMessage(''), 3500);
            }
        };

        runGeocode();

        return () => {
            cancelled = true;
        };
    }, [savedPrograms, geocodeCache]);

    useEffect(() => {
        if (!savedPrograms.length || !userLocation) return;

        const allProgramNames = new Set();
        savedPrograms.forEach((entry) => {
            (entry.recommendedPrograms || []).forEach((name) => allProgramNames.add(name));
        });

        const schoolsToCheck = universities
            .filter((school) => school.programs?.some((programName) => allProgramNames.has(programName)))
            .map((school) => {
                const cacheKey = getSchoolKey(school);
                const cachedCoords = geocodeCache[cacheKey];
                return {
                    ...school,
                    lat: school.lat ?? cachedCoords?.lat ?? null,
                    lon: school.lon ?? cachedCoords?.lon ?? null,
                };
            })
            .filter((school) => school.lat != null && school.lon != null);

        const missingRoutes = schoolsToCheck.filter((school) => {
            const routeKey = getRouteKey(originKey, school);
            return !routeCache[routeKey];
        });

        if (!missingRoutes.length) return;

        let cancelled = false;

        const runRouteDistance = async () => {
            setRouteProgress({ running: true, done: 0, total: missingRoutes.length });

            const updates = {};
            for (let i = 0; i < missingRoutes.length; i += 1) {
                if (cancelled) return;

                const school = missingRoutes[i];
                const routeKey = getRouteKey(originKey, school);

                const route = await getRoadDistanceViaProxy({
                    fromLat: userLocation.latitude ?? userLocation.lat,
                    fromLon: userLocation.longitude ?? userLocation.lng ?? userLocation.lon,
                    toLat: school.lat,
                    toLon: school.lon,
                });

                if (route?.distanceKm != null) {
                    updates[routeKey] = {
                        distanceKm: route.distanceKm,
                        durationMin: route.durationMin ?? null,
                        updatedAt: Date.now(),
                    };
                }

                setRouteProgress({ running: true, done: i + 1, total: missingRoutes.length });
            }

            if (!cancelled && Object.keys(updates).length) {
                setRouteCache((prev) => ({ ...prev, ...updates }));
            }

            if (!cancelled) {
                setRouteProgress((prev) => ({ ...prev, running: false }));
            }
        };

        runRouteDistance();

        return () => {
            cancelled = true;
        };
    }, [savedPrograms, userLocation, geocodeCache, routeCache, originKey]);

    useEffect(() => {
        return () => {
            if (geocodeMsgTimer.current) clearTimeout(geocodeMsgTimer.current);
        };
    }, []);

    const handleDelete = async (programId) => {
        if (!programId) return;
        const confirmed = window.confirm('Delete this record?');
        if (!confirmed) return;
        try {
            setDeletingId(programId);
            await deleteUserProgram(programId, auth.currentUser?.uid);
            setSavedPrograms((prev) => prev.filter((p) => p.id !== programId));
        } catch (err) {
            console.error(err);
            alert('Could not delete this history item.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="results-page-wrapper">
            <div className="results-container">
                <header className="results-header">
                    <button onClick={() => navigate('/home')} className="back-btn">
                        ← Back to Dashboard
                    </button>
                    <h1>History</h1>
                    <p style={{ color: 'var(--text-muted)', fontWeight: '500' }}>
                        Your personalized career path records.
                    </p>
                    {geocodingProgress.running && (
                        <p className="geo-status">
                            Calculating nearest schools... ({geocodingProgress.done}/{geocodingProgress.total})
                        </p>
                    )}
                    {routeProgress.running && (
                        <p className="geo-status">
                            Refining road distances... ({routeProgress.done}/{routeProgress.total})
                        </p>
                    )}
                    {!geocodingProgress.running && geocodingMessage && (
                        <p className="geo-status success">{geocodingMessage}</p>
                    )}
                    {locationError && (
                        <p className="geo-status warning">
                            Location not granted. Distances will be hidden until location access is enabled.
                        </p>
                    )}
                </header>

                {loading ? (
                    <div className="loading" style={{textAlign: 'center', padding: '3rem', color: '#6366f1', fontWeight: '700'}}>
                        ✨ Optimizing your records...
                    </div>
                ) : (
                    <div className="results-grid-full">
                        {savedPrograms.length > 0 ? (
                            savedPrograms.map((program, index) => {
                                const primary = program.recommendedPrograms?.[0];
                                const suggestions = program.recommendedPrograms?.slice(1) || [];
                                const primarySchools = getUniversitiesForProgram(primary);
                                return (
                                    <div key={program.id || index} className="detailed-card">
                                        <div className="card-top">
                                            <span className="count">RECORD #{savedPrograms.length - index}</span>
                                            <div className="score-box">
                                                Score: <b>{program.Score}</b>
                                            </div>
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDelete(program.id)}
                                                disabled={deletingId === program.id}
                                            >
                                                {deletingId === program.id ? 'Deleting…' : 'Delete'}
                                            </button>
                                        </div>
                                        
                                        <h3>{program.Recommended_Field || 'Recommended Program'}</h3>

                                        <div className="card-mid">
                                            {primary && (
                                                <div className="primary-rec">
                                                    <p className="label">Recommended Program</p>
                                                    <span className="tag primary-tag">{primary}</span>
                                                    <div className="program-universities">
                                                        <p className="program-label">Recommended Schools</p>
                                                        {primarySchools.length > 0 ? (
                                                            <ul className="university-list">
                                                                {primarySchools.map((school) => (
                                                                    <li key={`${primary}-${school.name}`}>
                                                                        <span className="school-name">{school.name}</span>
                                                                        <span className="school-location">{school.location}</span>
                                                                        {school.routeDistanceKm != null ? (
                                                                            <span className="school-distance"> {Math.round(school.routeDistanceKm)} km away</span>
                                                                        ) : school.distance != null ? (
                                                                            <span className="school-distance"> ~{Math.round(school.distance)} km away</span>
                                                                        ) : null}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="no-schools">No school matches yet.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {suggestions.length > 0 && (
                                                <div className="suggestions">
                                                    <p className="label">Other Suggestions</p>
                                                    <div className="tags">
                                                        {suggestions.map((p, i) => (
                                                            <span key={i} className="tag">{p}</span>
                                                        ))}
                                                    </div>
                                                    <div className="program-universities">
                                                        <p className="program-label">Recommended Schools per Suggestion</p>
                                                        {suggestions.map((programName) => (
                                                            <div key={`schools-${programName}`} className="suggestion-schools">
                                                                <span className="suggestion-name">{programName}</span>
                                                                {getUniversitiesForProgram(programName).length > 0 ? (
                                                                    <ul className="university-list">
                                                                        {getUniversitiesForProgram(programName).map((school) => (
                                                                            <li key={`${programName}-${school.name}`}>
                                                                                <span className="school-name">{school.name}</span>
                                                                                <span className="school-location">{school.location}</span>
                                                                                {school.routeDistanceKm != null ? (
                                                                                    <span className="school-distance"> {Math.round(school.routeDistanceKm)} km away</span>
                                                                                ) : school.distance != null ? (
                                                                                    <span className="school-distance"> ~{Math.round(school.distance)} km away</span>
                                                                                ) : null}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                ) : (
                                                                    <p className="no-schools">No school matches yet.</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="card-bottom">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                            </svg>
                                            {program.timestamp && new Date(program.timestamp.toDate()).toLocaleString('en-US', {
                                                month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{textAlign: 'center', padding: '4rem', color: '#94a3b8'}}>
                                <p>No records found yet. Start your journey today!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Results;