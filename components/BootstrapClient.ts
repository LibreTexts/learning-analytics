"use client";

import { useEffect } from "react";

// https://1manstartup.com/blogs/install-bootstrap-for-nextjs-app-router
function BootstrapClient() {
  useEffect(() => {
    require("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return null;
}

export default BootstrapClient;
