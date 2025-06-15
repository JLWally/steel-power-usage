import { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

interface RecordRow {
  date: string;
  Usage_kWh: number;
  Load_Type: string;
  Day_of_week: string;
}

export default function App() {
  // form state
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [dow, setDow] = useState("");
  const [weekend, setWeekend] = useState(false);
  const [loadType, setLoadType] = useState("");
  const [metric, setMetric] = useState("mean");

  // data state
  const [stat, setStat] = useState<{ metric: string; value: number } | null>(null);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [dailyAvg, setDailyAvg] = useState<{ date: string; value: number }[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // pagination
  const limit = 10;
  const [page, setPage] = useState(1);

  /* ---------------------------- fetchStat -------------------------------- */
  const fetchStat = async () => {
    try {
      setHasSearched(true);
      setPage(1);           // reset pagination
      setDailyAvg([]);      // clear old daily table

      // build params
  const params: any = { metric };
      if (start) params.start = start;
      if (end) params.end = end;
      if (dow.trim()) params.dow = dow;
      if (loadType.trim()) params.load_type = loadType;
      if (weekend) params.weekend = true;

      // average stat
      const statRes = await axios.get("http://127.0.0.1:8000/stats", { params });
      setStat(statRes.data);

      // first-page records
      const recRes = await axios.get("http://127.0.0.1:8000/records", {
        params: { ...params, limit },
      });
      setRecords(recRes.data);

      // daily averages
      const dailyRes = await axios.get("http://127.0.0.1:8000/stats/daily", { params });
      setDailyAvg(dailyRes.data);
    } catch (err) {
      console.error("API error:", err);
      setStat(null);
      setRecords([]);
      setDailyAvg([]);
    }
  };

  /* ---------------------------- loadMore --------------------------------- */
  const loadMore = async () => {
    try {
      const nextPage = page + 1;
      const params: any = { metric };
      if (start) params.start = start;
      if (end) params.end = end;
      if (dow.trim()) params.dow = dow;
      if (loadType.trim()) params.load_type = loadType;
      if (weekend) params.weekend = true;

      const recRes = await axios.get("http://127.0.0.1:8000/records", {
        params: { ...params, limit: nextPage * limit },
      });
      setRecords(recRes.data);
      setPage(nextPage);
    } catch (err) {
      console.error("Pagination error:", err);
    }
  };

  /* ---------------------------- UI --------------------------------------- */
  return (
    <Box p={4} bgcolor="#fff" borderRadius={2} boxShadow={2} maxWidth="820px" m="40px auto">
      <Typography variant="h4" gutterBottom>Steel Power Usage</Typography>

      {/* filters */}
      <Box display="flex" gap={2} mb={2} alignItems="center">
        <TextField label="Start Date" placeholder="YYYY-MM-DD" value={start} onChange={e => setStart(e.target.value)} />
        <TextField label="End Date"   placeholder="YYYY-MM-DD" value={end}   onChange={e => setEnd(e.target.value)} />

        {/* Load Type */}
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Load Type</InputLabel>
          <Select value={loadType} label="Load Type" onChange={e => setLoadType(e.target.value)}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="Maximum_Load">Maximum_Load</MenuItem>
          <MenuItem value="Medium_Load">Medium_Load</MenuItem>
          <MenuItem value="Light_Load">Light_Load</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 150 }}>
  <InputLabel>Metric</InputLabel>
  <Select
    value={metric}
    label="Metric"
    onChange={(e) => setMetric(e.target.value)}
  >
    <MenuItem value="mean">Mean (Average)</MenuItem>
    <MenuItem value="min">Minimum</MenuItem>
    <MenuItem value="max">Maximum</MenuItem>
    <MenuItem value="sum">Sum</MenuItem>
    <MenuItem value="median">Median</MenuItem>
  </Select>
</FormControl>


        {/* Day of week */}
        <FormControl>
          <InputLabel>Day of Week</InputLabel>
          <Select value={dow} label="Day of Week" onChange={e => setDow(e.target.value as string)} sx={{ width: 150 }}>
            <MenuItem value="">Any</MenuItem>
            {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d => (
              <MenuItem key={d} value={d}>{d}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={<Switch checked={weekend} onChange={e => setWeekend(e.target.checked)} />}
          label="Weekend Only"
        />
      </Box>

      <Button variant="contained" onClick={fetchStat}>Get Stats</Button>

      {/* === stat output === */}
      {hasSearched && (
        <Box mt={4}>
          {stat && stat.value !== undefined ? (
            <Typography variant="h6">
              {stat.metric.toUpperCase()} Active Power:&nbsp;
              <strong>{stat.value.toFixed(3)} kWh</strong>
            </Typography>
          ) : (
            <Typography variant="h6" color="textSecondary">No statistic found.</Typography>
          )}
        </Box>
      )}

      {/* === records table === */}
      {hasSearched && (records.length > 0 ? (
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>Record Preview</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell><TableCell>Usage (kWh)</TableCell>
                  <TableCell>Load Type</TableCell><TableCell>Day of Week</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.slice(0, page * limit).map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{new Date(row.date).toLocaleDateString("en-US")}</TableCell>
                    <TableCell>{row.Usage_kWh}</TableCell>
                    <TableCell>{row.Load_Type}</TableCell>
                    <TableCell>{row.Day_of_week}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {records.length >= page * limit && (
            <Box textAlign="center" mt={2}>
              <Button variant="outlined" onClick={loadMore}>Show More</Button>
            </Box>
          )}
        </Box>
      ) : (
        <Box mt={2}><Typography variant="body2" color="textSecondary">No matching records found.</Typography></Box>
      ))}

      {/* === daily average table === */}
      {dailyAvg.length > 0 && (
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>Daily Average Usage</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow><TableCell>Date</TableCell><TableCell>Avg Usage (kWh)</TableCell></TableRow>
              </TableHead>
              <TableBody>
                {dailyAvg.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}