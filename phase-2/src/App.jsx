import { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  //Load data
  const GRID_ROWS = 6;
  const GRID_COLS = 5;
  const TOOLBAR_ITEMS = [
    { id: 1, name: "Washer (8 kg)", type: "washer", img: "./assets/washing-machine.svg" },
    { id: 2, name: "Washer (11 kg)", type: "washer", img: "./assets/washing-machine.svg" },
    { id: 3, name: "Dryer (18 kg)", type: "dryer", img: "./assets/washing-machine.svg" },
    { id: 4, name: "Dryer (25 kg)", type: "dryer", img: "./assets/washing-machine.svg" },
    { id: 5, name: "Folding Table", type: "table", img: "./assets/space.svg" },
    { id: 6, name: "Waiting Area", type: "waiting", img: "./assets/armchair.svg" },
  ];

  const formRef = useRef(null);

  const [step, setStep] = useState(() => Number(sessionStorage.getItem("step")) || 0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [grid, setGrid] = useState(() => {
    const savedGrid = sessionStorage.getItem("grid");
    return savedGrid ? JSON.parse(savedGrid) : Array(GRID_ROWS * GRID_COLS).fill(null);
  });

  const [gridError, setGridError] = useState("");

  const [value, setValue] = useState(() => {
    const savedValue = sessionStorage.getItem("formData");
    return savedValue
      ? JSON.parse(savedValue)
      : {
          name: "",
          desc: "",
          postalcode: "",
          city: "",
          address: "",
          openat: "1",
          openhours: "",
          wifi: false,
          entry: false,
          lounge: false,
          music: false,
          costumer: false,
          parking: "Easy",
        };
  });

  const [error, setError] = useState({
    name: "",
    desc: "",
    postalcode: "",
    city: "",
    address: "",
    openat: "",
    openhours: "",
  });

  useEffect(() => sessionStorage.setItem("step", step), [step]);
  useEffect(() => sessionStorage.setItem("grid", JSON.stringify(grid)), [grid]);
  useEffect(() => sessionStorage.setItem("formData", JSON.stringify(value)), [value]);

  //Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      formRef.current.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  //Step one input
  const handleChanges = (field, value) => {
    setValue((prev) => ({ ...prev, [field]: value }));
    setError((prev) => ({ ...prev, [field]: Validate(field, value) }));
  };

  const Validate = (field, value) => {
    switch (field) {
      case "name":
        return value.length === 0 ? "Name is required" :
          value.length < 3 ? "Name must be at least 5 characters" :
          value.length > 32 ? "Name must be less than 33 characters" : "";

      case "desc":
        return value.length === 0 ? "Description is required" :
          value.length < 10 ? "Description must be at least 10 characters" :
          value.length > 256 ? "Name must be less than 257 characters" : "";

      case "postalcode":
        return value.length === 0 ? "Postal code is required" :
          isNaN(parseInt(value)) ? "Postal code must be a number" :
          value.length !== 4 ? "Postal code must be 4 numbers" : "";

      case "city":
        return value.length === 0 ? "City is required" :
          value.length < 3 ? "City name must be at least 3 characters" :
          value.length > 32 ? "City name must be less than 33 characters" : "";

      case "address":
        return value.length === 0 ? "Address is required" :
          value.length < 5 ? "Address must be at least 5 characters" :
          value.length > 128 ? "Address must be less than 129 characters" : "";

      case "openhours":
        const regex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]?$/;
        return value.length === 0 ? "Opening Hours field is required" :
          !regex.test(value) ? "Open Hours must be in (hh:mm) format" : "";

      default:
        return "";
    }
  };

  //Step two drag&drop
  const handleDragStart = (event, item) => {
    event.dataTransfer.setData("item", JSON.stringify(item));
  };

  const handleDrop = (event, index) => {
    event.preventDefault();
    if (index < 0 || index >= 30) return;

    const itemData = event.dataTransfer.getData("item");
    if (!itemData) return;

    const item = JSON.parse(itemData);

    setGrid((prevGrid) => {
      const newGrid = [...prevGrid];
      newGrid[index] = item;
      return newGrid;
    });

    validateGridAndSetError(newGrid);
  };

  const allowDrop = (event) => {
    event.preventDefault();
    event.currentTarget.classList.add("hovered");
  };

  const resetOpacity = (event) => {
    event.currentTarget.classList.remove("hovered");
  };

  const handleClick = (index) => {
    setGrid((prevGrid) => {
      const newGrid = [...prevGrid];
      newGrid[index] = null;
      return newGrid;
    });

    validateGridAndSetError(newGrid);
  };

  const handleDoubleClick = (index) => {
    setGrid((prevGrid) => {
      const newGrid = [...prevGrid];
      newGrid[index] = { type: "wall" };
      return newGrid;
    });

    validateGridAndSetError(newGrid);
  };

  const handleRightClick = (event, index) => {
    event.preventDefault();
    setGrid((prevGrid) => {
      const newGrid = [...prevGrid];
      newGrid[index] = { type: "entrance" };
      return newGrid;
    });

    validateGridAndSetError(newGrid);
  };

  const validateGridAndSetError = (newGrid) => {
    const error = validateGrid(newGrid);
    setGridError(error);
  };

  const validateGrid = (grid) => {
    for (let i = 0; i < grid.length; i++) {
      if (grid[i]?.type === "washer" || grid[i]?.type === "dryer") {
        if (!isNextToWall(i, grid)) {
          return "Washers or Dryers can only be next to a wall.";
        }
      }
    }
    return null;
  };

  const isNextToWall = (index, grid) => {
    const neighbors = [
      index - 5,
      index + 5,
      index - 1,
      index + 1,
    ];

    return neighbors.some((neighbor) =>
      grid[neighbor]?.type === "wall" || isEdge(index)
    );
  };

  const isEdge = (index) => {
    return (
      index < 5 ||
      index >= 25 ||
      index % 5 === 0 ||
      (index + 1) % 5 === 0
    );
  };

  //Next, back button
  const nextValid = () => {
    if (step === 0) {
      const fields = ["name", "desc", "postalcode", "city", "address", "openhours"];
      const newErrors = {};

      fields.forEach(field => {
        const errorMsg = Validate(field, value[field]);
        if (errorMsg) {
          newErrors[field] = errorMsg;
        }
      });

      setError(newErrors);

      if (Object.keys(newErrors).length === 0) {
        nextStep();
      }
    } else if (step === 1) {
      const error = validateGrid(grid);
      if (error) {
        setGridError(error);
      } else {
        setGridError(null);
        nextStep();
      }
    } else {
      nextStep();
    }
  };

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const previousStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  //Last page interactions
  const startover = () => {
    setStep(0);
    setGrid(Array(30).fill(null));
    setValue({
      name: "",
      desc: "",
      postalcode: "",
      city: "",
      address: "",
      openat: "1",
      openhours: "",
      wifi: false,
      entry: false,
      lounge: false,
      music: false,
      costumer: false,
      parking: "Easy",
    });
  };

  const exportToCSV = () => {
    const csvRows = [];

    for (let row = 0; row < 6; row++) {
      const rowItems = [];
      for (let col = 0; col < 5; col++) {
        const index = row * 5 + col;
        const item = grid[index];
        rowItems.push(item ? item.name : '-');
      }
      csvRows.push(rowItems.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'floorplan.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = () => {
    const jsonString = JSON.stringify(value, null, 2);
    navigator.clipboard.writeText(jsonString)
      .then(() => console.log('Copied to clipboard!'))
      .catch(err => {console.error('Failed to copy: ', err);});
  };
  
  return (
    <>
    <article className="container" ref={formRef}>
      <header className="header">
        <h1>Register a new location</h1>
        <div className="steps">
          {
          step === 0 ? (
            <button className="step current">1</button>
          ) : 3 > step >= 1 ? (
            <button className="step done">1</button>
          ) : step === 3 ? (
            <button className="step done">
              <img src="./assets/check.svg" alt="Check" />
            </button>
          ) : null
          }
          {
            step < 1 ? (
              <div className="step-divider dashed"></div>
            ) : (<div className="step-divider"></div>)
          }
          {
          step === 0 ? (
            <button className="step" disabled>2</button>
          ) : step === 1 ? (
            <button className="step current">2</button>
          ) : step === 2 ? (
            <button className="step done">2</button>
          ) : step === 3 ? (
            <button className="step done">
              <img src="./assets/check.svg" alt="Check" />
            </button>
          ) : null
          }
          {
            step < 2 ? (
              <div className="step-divider dashed"></div>
            ) : (<div className="step-divider"></div>)
          }
          {
          step < 2 ? (
            <button className="step" disabled>3</button>
          ) : step === 2 ? (
            <button className="step current">3</button>
          ) : step === 3 ? (
            <button className="step done">
              <img src="./assets/check.svg" alt="Check" />
            </button>
          ) : null
          }
          {
            step < 3 ? (
              <div className="step-divider dashed"></div>
            ) : (<div className="step-divider"></div>)
          }
          {
          step < 3 ? (
            <button className="step" disabled>4</button>
          ) : step === 3 ? (
            <button className="step done">
              <img src="./assets/check.svg" alt="Check" />
            </button>
          ) : null
          }
        </div>
        <button className="fullscreen-btn" onClick={toggleFullscreen}>
          <img src={isFullscreen ? "./assets/minimize.svg" : "./assets/maximize.svg"} alt="Fullscreen" />
        </button>
      </header>

          <main className="main">

          {step === 0 && (
            <>
            <h2>Information about the Location</h2>
              <div className="input-row">
                <div className="input-group">
                  <label htmlFor="input-name">Name</label>
                  <input type="text" id="input-name" placeholder="Name" value={value.name} onChange={(e) => handleChanges("name", e.target.value)} className={error.name ? "error" : ""}/>
                  {error.name && <span className="input-error">{error.name}</span>}
                </div>
              </div>

              <div className="input-group">
                  <label htmlFor="textarea">Description</label>
                  <textarea id="textarea" rows="5" placeholder="Description" value={value.desc} onChange={(e) => handleChanges("desc", e.target.value)} className={error.desc ? "error" : ""}></textarea>
                  {error.desc && <span className="input-error">{error.desc}</span>}
              </div>

              <div className="input-row">
              <div className="input-group">
                <label htmlFor="input-pc">Postal Code</label>
                <input type="text" id="input-pc" placeholder="Postal Code" value={value.postalcode} onChange={(e) => handleChanges("postalcode", e.target.value)} className={error.postalcode ? "error" : ""}/>
                {error.postalcode && <span className="input-error">{error.postalcode}</span>}
              </div>

                <div className="input-group">
                  <label htmlFor="input-city">City</label>
                  <input type="text" id="input-city" placeholder="City" value={value.city} onChange={(e) => handleChanges("city", e.target.value)} className={error.city ? "error" : ""}/>
                  {error.city && <span className="input-error">{error.city}</span>}
                </div>

                <div className="input-group">
                  <label htmlFor="input-address">Address</label>
                  <input type="text" id="input-address" placeholder="Address" value={value.address} onChange={(e) => handleChanges("address", e.target.value)} className={error.address ? "error" : ""}/>
                  {error.address && <span className="input-error">{error.address}</span>}
                </div>
              </div>

              <hr />

              <h2>Operational hours</h2>

              <div className="input-group">
                <label htmlFor="select">Open At</label>
                <select id="select" value={value.openat} onChange={(e) => handleChanges("openat", e.target.value)}>
                  <option value="1">Every Day</option>
                  <option value="2">Weekdays</option>
                  <option value="3">Weekends</option>
                </select>
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label htmlFor="input-openhours">Opening Hours</label>
                  <input type="text" id="input-openhours" placeholder="Opening Hours" value={value.openhours} onChange={(e) => handleChanges("openhours", e.target.value)} className={error.openhours ? "error" : ""}/>
                  {error.openhours && <span className="input-error">{error.openhours}</span>}
                </div>
              </div>
          </>
        )}

        {step === 1 && (
        <>
        <h2>Subtitle inside the htmlForm</h2>
        <div className="dnd-row">
            {TOOLBAR_ITEMS.map((item) => (
              <div
                key={item.id}
                className="grid-item"
                draggable
                onDragStart={(event) => handleDragStart(event, item)}
              >
                <img src={item.img} alt={item.name} />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
          { gridError && (
            <div className="alert">
            <img src="./assets/alert.svg" alt="Alert" />
            <span>{gridError}</span>
          </div>
        )}
          <div className="grid">
            {grid.map((cell, index) => (
              <div
                key={index}
                className={`grid-item ${cell ? cell.type : "empty"}`}
                onDrop={(event) => handleDrop(event, index)}
                onDragOver={allowDrop}
                onDragLeave={resetOpacity}
                onClick={() => handleClick(index)}
                onDoubleClick={() => handleDoubleClick(index)}
                onContextMenu={(event) => handleRightClick(event, index)}
              >
                {cell && 'img' in cell && <img src={cell.img} alt={cell.name} />}
                {cell?.type === "wall" && <span>Wall</span>}
                {cell?.type === "entrance" && <span>Entrance</span>}
                {!cell && <span className="empty-box">Empty</span>}
              </div>
            ))}
          </div>
            </>
        )}

        {step === 2 && (
          <>
        <h2>Amenities and Services</h2>
            <label className="cnr-label">
              <input type="checkbox" name="wifi" checked={value.wifi} onChange={(e) => handleChanges("wifi", e.target.value)}/>
              <span>Free Wi-Fi</span>
            </label>

            <label className="cnr-label">
              <input type="checkbox" name="entry" checked={value.entry} onChange={(e) => handleChanges("entry", e.target.value)}/>
              <span>Accessible entry</span>
            </label>

            <label className="cnr-label">
              <input type="checkbox" name="lounge" checked={value.lounge} onChange={(e) => handleChanges("lounge", e.target.value)}/>
              <span>Lounge Area</span>
            </label>

            <label className="cnr-label">
              <input type="checkbox" name="music" checked={value.music} onChange={(e) => handleChanges("music", e.target.value)}/>
              <span>Background Music</span>
            </label>

            <label className="cnr-label">
              <input type="checkbox" name="costumer" checked={value.costumer} onChange={(e) => handleChanges("costumer", e.target.value)}/>
              <span>Personal customer service</span>
            </label>

            <hr />
            <h2>Parking</h2>

            <div className="input-row">
              <label className="cnr-label">
                <input type="radio" name="parking" value="Easy" checked={value.parking==="Easy"} onChange={(e) => handleChanges("parking", e.target.value)}/>
                <span>Easy</span>
              </label>
              <label className="cnr-label">
              <input type="radio" name="parking" value="Medium" checked={value.parking==="Medium"} onChange={(e) => handleChanges("parking", e.target.value)}/>
                <span>Medium</span>
              </label>
              <label className="cnr-label">
              <input type="radio" name="parking" value="Hard" checked={value.parking==="Hard"} onChange={(e) => handleChanges("parking", e.target.value)}/>
                <span>Hard</span>
              </label>
            </div>
            </>
        )}

        {step === 3 && (
          <>
          <div className="FinishScreen">
          <h2>Succesful submission</h2>
            <h3>Thank you for the new location registration!</h3>
            <button className="btn" onClick={copyToClipboard}>COPY FROM VALUES</button>
            <br />
            <button className="btn" onClick={exportToCSV}>EXPORT FLOORPLAN</button>
            <hr />
            <button className="btn" onClick={startover}>START OVER</button>
          </div>
            </>
        )}
          </main>
        <div hidden={step === 3}>
          <footer className="footer" >
            <button className="btn" disabled={step === 0} onClick={previousStep}>Back</button>
            <button className="btn" onClick={nextValid}>Next</button>
          </footer>
        </div>  

        </article>
    </>
  )
}

export default App