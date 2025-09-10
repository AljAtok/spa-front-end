import { Box, Typography } from "@mui/material";
import { Header } from "../../components/Header";

const Dashboard: React.FC = () => {
  // const exampleSelect = (
  //   <select style={{ padding: "8px", borderRadius: "4px" }}>
  //     <option value="option1">Option 1</option>
  //     <option value="option2">Option 2</option>
  //   </select>
  // );

  // const exampleButton = (
  //   <Button
  //     variant="contained"
  //     color="primary"
  //     onClick={() => alert("Action!")}
  //   >
  //     Perform Action
  //   </Button>
  // );

  return (
    <Box m="5px 10px auto 10px">
      <Header
        title="DASHBOARD"
        subtitle="Welcome to your dashboard"
        // selectComponent={exampleSelect} // Pass select component here
        // actionButton={exampleButton} // Pass action button here
      />
      <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap="20px">
        {/* dashboard content goes here */}
        <Box
          gridColumn="span 12"
          p="20px"
          border="1px solid lightgrey"
          borderRadius="8px"
        >
          <Typography variant="h6">
            This is where dashboard data would live.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
