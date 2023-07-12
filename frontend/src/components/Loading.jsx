// Loading.js
import React from "react";
import Col from "react-bootstrap/Col";

const Loading = ({ isLoading }) => {
  return <>{isLoading && <Col>Transaction is being processed...</Col>}</>;
};

export default Loading;
