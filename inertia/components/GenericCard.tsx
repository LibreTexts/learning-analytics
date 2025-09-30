"use client";
import { Card, CardProps } from "react-bootstrap";
import classNames from "classnames";

interface GenericCardProps extends CardProps {
  children: React.ReactNode;
}

const GenericCard: React.FC<GenericCardProps> = ({
  children,
  className,
  ...rest
}) => {
  return (
    <Card className={classNames(className, "tw:border tw:shadow-sm")} {...rest}>
      <Card.Body>{children}</Card.Body>
    </Card>
  );
};

export default GenericCard;
