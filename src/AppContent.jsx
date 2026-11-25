import React, { useState } from "react";
import App from "./App";
import GenerateJson from "./GenerateJson";

import { Container, Navbar, Nav } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

function Main() {

  const [page, setPage] = useState("/");

  return (
    <>
      <Container className="mt-4">

        {/* NAVBAR */}
        <Navbar bg="light" expand="lg" className="mb-4 rounded px-3">
          <Container fluid>

            <Navbar.Brand style={{ fontWeight: 600 }}>
              <span
                style={{ cursor: "pointer" }}
                onClick={() => setPage("/")}
              >
                FAIR Review and Metadata Evaluation Engine (FRAME)
              </span>
            </Navbar.Brand>

            <Navbar.Toggle aria-controls="main-navbar" />

            <Navbar.Collapse id="main-navbar">
              <Nav className="ms-auto">

                <Nav.Link
                  active={page === "/"}
                  onClick={() => setPage("/")}
                >
                  Home
                </Nav.Link>

                <Nav.Link
                  active={page === "generate"}
                  onClick={() => setPage("generate")}
                >
                  Generate JSON
                </Nav.Link>

                <Nav.Link
                  href="https://frame-metadata-assessment.readthedocs.io/en/latest/user_guides/running-frame.html"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Docs
                </Nav.Link>

              </Nav>
            </Navbar.Collapse>

          </Container>
        </Navbar>

        {/* PAGE SWITCH */}
        <Container>

          {page === "/" && <App setPage={setPage} />}

          {page === "generate" && <GenerateJson />}

        </Container>

      </Container>
    </>
  );
}

export default Main;