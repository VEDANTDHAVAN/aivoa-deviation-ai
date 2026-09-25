import { useEffect, useMemo, useState } from "react";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { fetchDeviations } from "../features/deviation/deviationSlice";
import type { Severity } from "../types/deviation";
import { Link } from "react-router-dom";

export default function DeviationDashboard() {
  const dispatch = useAppDispatch();

  const {
    deviations,
    isLoadingDeviations,
    error,
  } = useAppSelector(
      (state) => state.deviation
    );

  const [search, setSearch] = useState("");

  const [severity, setSeverity] = useState<Severity | "">("");

  useEffect(() => {
    dispatch(fetchDeviations());
  }, [dispatch]);

  const filteredDeviations = useMemo(() => {
      const query = search.trim().toLowerCase();

      return deviations.filter((deviation) => {
          const matchesSearch = !query || 
            deviation.title
              .toLowerCase()
              .includes(query) ||
            deviation.site
              .toLowerCase()
              .includes(query) ||
            deviation.batchLotNumber
              .toLowerCase()
              .includes(query);

          const matchesSeverity = !severity ||
            deviation.initialSeverity === severity;

          return (
            matchesSearch && matchesSeverity
          );
        }
      );
    }, [
      deviations, search, severity,
    ]);

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            A
          </div>
          <div>
            <strong>
              AIVOA.AI
            </strong>
            <span>
              Deviation Management
            </span>
          </div>
        </div>
      </header>
      <main className="content">
        <div className="page-header">
          <span className="eyebrow">
            QUALITY MANAGEMENT
          </span>
          <h1>
            Deviation History
          </h1>
          <p>
            Review previously logged
            manufacturing deviations.
          </p>
        </div>
        <section className="panel">
          <div className="dashboard-toolbar">
            <input
              className="search-input"
              value={search}
              onChange={(event) => setSearch(
                  event.target.value
                )
              }
              placeholder={
                "Search title, site or batch..."
              }
            />
            <select
              value={severity}
              onChange={(event) =>
                setSeverity(
                  event.target.value as
                    | Severity | ""
                )
              }
            >
              <option value="">
                All severities
              </option>
              <option value="Critical">
                Critical
              </option>
              <option value="Major">
                Major
              </option>
              <option value="Minor">
                Minor
              </option>
            </select>
          </div>

          {isLoadingDeviations && (
            <div className="empty-state">
              Loading deviations...
            </div>
          )}

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          {!isLoadingDeviations &&
            filteredDeviations.length === 0 && (
              <div className="empty-state">
                No deviations found.
              </div>
            )}

          {!isLoadingDeviations &&
            filteredDeviations.length > 0 && (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Site</th>
                      <th>Batch / Lot</th>
                      <th>Severity</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeviations.map(
                      (deviation) => (
                        <tr
                          key={deviation.id}
                        >
                          <td>
                            #{deviation.id}
                          </td>
                          <td>
                            <strong>
                              <Link to={`/deviations/${deviation.id}`}>{deviation.title}</Link>
                            </strong>
                          </td>
                          <td>
                            {deviation.site}
                          </td>
                          <td>
                            {deviation.batchLotNumber}
                          </td>
                          <td>
                            <span
                              className={
                                `severity severity-${deviation.initialSeverity.toLowerCase()}`
                              }
                            >
                              {
                                deviation.initialSeverity
                              }
                            </span>
                          </td>
                          <td>
                            {
                              deviation.dateOfOccurrence
                            }
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      </main>
    </div>
  );
}
